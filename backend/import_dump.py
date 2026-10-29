"""Import the supplied MariaDB phpMyAdmin dump into a local SQLite file.

Only CREATE TABLE, INSERT, primary-key, auto-increment, and unique-index
metadata are interpreted. The source dump is never executed as SQL.
"""

from __future__ import annotations

import argparse
import re
import sqlite3
from pathlib import Path
from typing import Any

EXPECTED_TABLES = {
    "alumnus_bio", "bistaa_submissions", "courses", "events", "event_commits",
    "gallery", "system_settings", "users", "vista_active_members",
}


def sqlite_type(mysql_type: str) -> str:
    type_name = mysql_type.lower().split("(", 1)[0]
    if type_name in {"int", "integer", "tinyint", "smallint", "mediumint", "bigint", "year", "bool", "boolean"}:
        return "INTEGER"
    if type_name in {"decimal", "numeric", "float", "double", "real"}:
        return "NUMERIC"
    if type_name in {"blob", "mediumblob", "longblob", "binary", "varbinary"}:
        return "BLOB"
    return "TEXT"


def parse_create_tables(sql: str) -> dict[str, list[tuple[str, str, str]]]:
    tables: dict[str, list[tuple[str, str, str]]] = {}
    pattern = re.compile(r"CREATE TABLE `([^`]+)` \((.*?)\) ENGINE=", re.S | re.I)
    for match in pattern.finditer(sql):
        table = match.group(1)
        columns = []
        for line in match.group(2).splitlines():
            field = re.match(r"\s*`([^`]+)`\s+(.+?)[, ]*\s*$", line)
            if not field:
                continue
            name, raw_definition = field.groups()
            type_match = re.match(r"([A-Za-z]+(?:\([^)]*\))?)", raw_definition)
            if not type_match:
                continue
            mysql_type = type_match.group(1)
            rest = raw_definition[type_match.end():]
            rest = re.sub(r"\s+COMMENT\s+'(?:\\.|[^'])*'", "", rest, flags=re.I)
            rest = re.sub(r"\s+COLLATE\s+\w+", "", rest, flags=re.I)
            rest = rest.replace("AUTO_INCREMENT", "")
            rest = re.sub(r"DEFAULT\s+current_timestamp\(\)", "DEFAULT CURRENT_TIMESTAMP", rest, flags=re.I)
            rest = re.sub(r"DEFAULT\s+current_timestamp\b", "DEFAULT CURRENT_TIMESTAMP", rest, flags=re.I)
            rest = re.sub(r"\s+ON UPDATE\s+CURRENT_TIMESTAMP(?:\(\))?", "", rest, flags=re.I)
            clauses = []
            if re.search(r"\bNOT NULL\b", rest, re.I):
                clauses.append("NOT NULL")
            default = re.search(r"\bDEFAULT\s+('(?:\\.|[^'])*'|CURRENT_TIMESTAMP|NULL|-?\d+(?:\.\d+)?)", rest, re.I)
            if default:
                value = default.group(1)
                clauses.append(f"DEFAULT {value}")
            columns.append((name, sqlite_type(mysql_type), " ".join(clauses)))
        tables[table] = columns
    if not tables:
        raise ValueError("No supported CREATE TABLE statements were found in the dump.")
    return tables


def parse_indexes(sql: str) -> tuple[dict[str, list[str]], dict[str, list[list[str]]], set[str]]:
    primary: dict[str, list[str]] = {}
    unique: dict[str, list[list[str]]] = {}
    auto_increment: set[str] = set()
    for match in re.finditer(r"ALTER TABLE `([^`]+)`\s+([^;]+);", sql, re.S | re.I):
        table, clause = match.groups()
        primary_match = re.search(r"ADD PRIMARY KEY\s*\(([^)]+)\)", clause, re.I)
        if primary_match:
            primary[table] = re.findall(r"`([^`]+)`", primary_match.group(1))
        unique.setdefault(table, [])
        for unique_match in re.finditer(r"ADD UNIQUE KEY `[^`]+`\s*\(([^)]+)\)", clause, re.I):
            unique[table].append(re.findall(r"`([^`]+)`", unique_match.group(1)))
        if re.search(r"MODIFY `id`[^;]*AUTO_INCREMENT", clause, re.I):
            auto_increment.add(table)
    return primary, unique, auto_increment


def mysql_string(source: str, start: int) -> tuple[str, int]:
    index = start + 1
    chars: list[str] = []
    escapes = {"0": "\0", "b": "\b", "n": "\n", "r": "\r", "t": "\t", "Z": "\x1a", "\\": "\\", "'": "'", '"': '"'}
    while index < len(source):
        char = source[index]
        if char == "\\" and index + 1 < len(source):
            index += 1
            chars.append(escapes.get(source[index], source[index]))
        elif char == "'":
            if index + 1 < len(source) and source[index + 1] == "'":
                chars.append("'")
                index += 1
            else:
                return "".join(chars), index + 1
        else:
            chars.append(char)
        index += 1
    raise ValueError("Unterminated string in INSERT data.")


def parse_insert_values(source: str, index: int) -> list[tuple[Any, ...]]:
    rows: list[tuple[Any, ...]] = []
    length = len(source)
    while index < length:
        while index < length and (source[index].isspace() or source[index] == ","):
            index += 1
        if index >= length or source[index] == ";":
            break
        if source[index] != "(":
            raise ValueError("Unexpected syntax in INSERT values.")
        index += 1
        row: list[Any] = []
        while index < length:
            while index < length and source[index].isspace():
                index += 1
            if source[index] == "'":
                value, index = mysql_string(source, index)
            else:
                value_start = index
                while index < length and source[index] not in ",)":
                    index += 1
                token = source[value_start:index].strip()
                if token.upper() == "NULL":
                    value = None
                elif re.fullmatch(r"-?\d+", token):
                    value = int(token)
                elif re.fullmatch(r"-?\d+\.\d+", token):
                    value = float(token)
                else:
                    value = token
            row.append(value)
            while index < length and source[index].isspace():
                index += 1
            if index < length and source[index] == ",":
                index += 1
                continue
            if index < length and source[index] == ")":
                index += 1
                break
            raise ValueError("Malformed row in INSERT values.")
        rows.append(tuple(row))
        while index < length and source[index].isspace():
            index += 1
        if index < length and source[index] == ";":
            break
    return rows


def iter_inserts(sql: str):
    pattern = re.compile(r"INSERT INTO `([^`]+)`\s*\((.*?)\)\s*VALUES\s*", re.S | re.I)
    for match in pattern.finditer(sql):
        table = match.group(1)
        columns = re.findall(r"`([^`]+)`", match.group(2))
        index = match.end()
        quote = False
        escaped = False
        end = index
        while end < len(sql):
            char = sql[end]
            if quote:
                if escaped:
                    escaped = False
                elif char == "\\":
                    escaped = True
                elif char == "'":
                    if end + 1 < len(sql) and sql[end + 1] == "'":
                        end += 1
                    else:
                        quote = False
            elif char == "'":
                quote = True
            elif char == ";":
                break
            end += 1
        yield table, columns, parse_insert_values(sql, index)


def create_sqlite_table(connection: sqlite3.Connection, table: str, columns: list[tuple[str, str, str]], primary: dict[str, list[str]], unique: dict[str, list[list[str]]], auto_increment: set[str]) -> None:
    primary_columns = primary.get(table, [])
    definitions = []
    for name, data_type, clauses in columns:
        quoted_name = f'"{name.replace(chr(34), chr(34) * 2)}"'
        if table in auto_increment and name == "id" and name in primary_columns:
            definition = f"{quoted_name} INTEGER PRIMARY KEY AUTOINCREMENT"
        else:
            definition = f"{quoted_name} {data_type} {clauses}".strip()
            if name in primary_columns and len(primary_columns) == 1:
                definition += " PRIMARY KEY"
        definitions.append(definition)
    if len(primary_columns) > 1:
        names = ", ".join(f'"{name}"' for name in primary_columns)
        definitions.append(f"PRIMARY KEY ({names})")
    for columns_in_index in unique.get(table, []):
        names = ", ".join(f'"{name}"' for name in columns_in_index)
        definitions.append(f"UNIQUE ({names})")
    connection.execute(f'CREATE TABLE "{table}" ({", ".join(definitions)})')


def import_dump(source_path: Path, output_path: Path, replace: bool = False) -> dict[str, int]:
    if not source_path.is_file():
        raise FileNotFoundError(f"SQL dump not found: {source_path}")
    if output_path.exists() and not replace:
        raise FileExistsError(f"Refusing to overwrite existing database file: {output_path}. Use --replace only if you intend to rebuild it.")

    sql = source_path.read_text(encoding="utf-8-sig")
    tables = parse_create_tables(sql)
    unknown = set(tables) - EXPECTED_TABLES
    if unknown:
        raise ValueError(f"Unexpected tables in input dump: {', '.join(sorted(unknown))}")
    if tables.keys() != EXPECTED_TABLES:
        missing = EXPECTED_TABLES - tables.keys()
        raise ValueError(f"Dump is missing expected tables: {', '.join(sorted(missing))}")
    primary, unique, auto_increment = parse_indexes(sql)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    if replace and output_path.exists():
        output_path.unlink()
    counts = {table: 0 for table in tables}
    connection = sqlite3.connect(output_path)
    try:
        connection.execute("PRAGMA journal_mode=DELETE")
        connection.execute("PRAGMA foreign_keys=ON")
        with connection:
            for table, columns in tables.items():
                create_sqlite_table(connection, table, columns, primary, unique, auto_increment)
            for table, columns, rows in iter_inserts(sql):
                if table not in tables:
                    raise ValueError(f"INSERT references unsupported table: {table}")
                expected_columns = {column[0] for column in tables[table]}
                if not set(columns).issubset(expected_columns):
                    raise ValueError(f"INSERT for {table} references a column absent from its CREATE TABLE.")
                if any(len(row) != len(columns) for row in rows):
                    raise ValueError(f"INSERT for {table} has a mismatched value count.")
                quoted_columns = ", ".join(f'"{column}"' for column in columns)
                placeholders = ", ".join("?" for _ in columns)
                connection.executemany(f'INSERT INTO "{table}" ({quoted_columns}) VALUES ({placeholders})', rows)
                counts[table] += len(rows)
    except Exception:
        connection.close()
        if output_path.exists():
            output_path.unlink()
        raise
    connection.close()
    return counts


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert the supplied MariaDB alumni dump into a local SQLite database.")
    parser.add_argument("dump", type=Path, help="Path to the private alumni_db SQL dump")
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parent / "alumni.sqlite3", help="Output database file (default: backend/alumni.sqlite3)")
    parser.add_argument("--replace", action="store_true", help="Replace an existing output database file")
    args = parser.parse_args()
    counts = import_dump(args.dump, args.output.resolve(), replace=args.replace)
    print(f"Imported {sum(counts.values())} records into {args.output.resolve()}.")
    for table, count in counts.items():
        print(f"  {table}: {count} rows")


if __name__ == "__main__":
    main()
