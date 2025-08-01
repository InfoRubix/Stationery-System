# Google Sheets Database Schema

This document describes the structure of the Google Sheets database used by the stationery management system.

## ITEMLOG Sheet
Contains inventory items and their stock information.

| Column | Name | Index | Description |
|--------|------|-------|-------------|
| A | ID | 0 | Unique identifier for each item |
| B | NAMA BARANG | 1 | Item name |
| C | BILANGAN | 2 | Base quantity |
| D | IMAGE | 3 | Image URL or reference |
| E | BIL LOG*1 | 4 | Log quantity 1 |
| F | BIL LOG*2 | 5 | Log quantity 2 |
| G | BIL LOG*3 | 6 | Log quantity 3 |
| H | BIL LOG*4 | 7 | Log quantity 4 |
| I | BIL LOG*5 | 8 | Log quantity 5 |
| J | BIL LOG*6 | 9 | Log quantity 6 |
| K | BIL LOG*7 | 10 | Log quantity 7 |
| L | BIL LOG*8 | 11 | Log quantity 8 |
| M | BIL LOG*9 | 12 | Log quantity 9 |
| N | BIL LOG*10 | 13 | Log quantity 10 |
| O | TOTAL | 14 | Total quantity |
| P | CURRENT | 15 | Current available stock |
| Q | TARGETSTOCK | 16 | Target stock level |
| R | CATEGORY | 17 | Item category |
| S | LIMIT | 18 | Admin-set limit for requests |

## LOG Sheet
Contains user requests and their status.

| Column | Name | Index | Description |
|--------|------|-------|-------------|
| A | ID | 0 | Unique log/request ID |
| B | TARIKH DAN MASA | 1 | Date and time |
| C | EMAIL | 2 | User email |
| D | DEPARTMENT | 3 | User department |
| E | NAMA BARANG*1 | 4 | Item name 1 |
| F | BILANGAN*1 | 5 | Quantity 1 |
| G | NAMA BARANG*2 | 6 | Item name 2 |
| H | BILANGAN*2 | 7 | Quantity 2 |
| I | NAMA BARANG*3 | 8 | Item name 3 |
| J | BILANGAN*3 | 9 | Quantity 3 |
| K | NAMA BARANG*4 | 10 | Item name 4 |
| L | BILANGAN*4 | 11 | Quantity 4 |
| M | NAMA BARANG*5 | 12 | Item name 5 |
| N | BILANGAN*5 | 13 | Quantity 5 |
| O | NAMA BARANG*6 | 14 | Item name 6 |
| P | BILANGAN*6 | 15 | Quantity 6 |
| Q | NAMA BARANG*7 | 16 | Item name 7 |
| R | BILANGAN*7 | 17 | Quantity 7 |
| S | NAMA BARANG*8 | 18 | Item name 8 |
| T | BILANGAN*8 | 19 | Quantity 8 |
| U | NAMA BARANG*9 | 20 | Item name 9 |
| V | BILANGAN*9 | 21 | Quantity 9 |
| W | NAMA BARANG*10 | 22 | Item name 10 |
| X | BILANGAN*10 | 23 | Quantity 10 |
| Y | STATUS | 24 | Request status (PENDING/APPROVE/DECLINE/APPLY) |

## PRICESTOCK Sheet
Contains pricing tiers for items.

| Column | Name | Index | Description |
|--------|------|-------|-------------|
| A | ID | 0 | Unique identifier |
| B | NAMA BARANG | 1 | Item name |
| C | BASE PRICE | 2 | Base price |
| D | TYPE STOCK | 3 | Stock type |
| E | TIER 1 QTY | 4 | Tier 1 quantity threshold |
| F | TIER 1 PRICE | 5 | Tier 1 price |
| G | TIER 2 QTY | 6 | Tier 2 quantity threshold |
| H | TIER 2 PRICE | 7 | Tier 2 price |
| I | TIER 3 QTY | 8 | Tier 3 quantity threshold |
| J | TIER 3 PRICE | 9 | Tier 3 price |
| K | TIER 4 QTY | 10 | Tier 4 quantity threshold |
| L | TIER 4 PRICE | 11 | Tier 4 price |
| M | TIER 5 QTY | 12 | Tier 5 quantity threshold |
| N | TIER 5 PRICE | 13 | Tier 5 price |

## EXPENSELOG Sheet
Contains expense transaction logs.

| Column | Name | Index | Description |
|--------|------|-------|-------------|
| A | ID | 0 | Unique identifier |
| B | DATETIME | 1 | Date and time |
| C | ITEM NAME | 2 | Item name |
| D | TIER QTY | 3 | Tier quantity |
| E | QUANTITY | 4 | Actual quantity |
| F | TIER PRICE | 5 | Tier price |
| G | TOTAL PRICE | 6 | Total price |

## EXPENSESTATUS Sheet
Contains expense requests with status.

| Column | Name | Index | Description |
|--------|------|-------|-------------|
| A | ID | 0 | Unique identifier |
| B | DATETIME | 1 | Date and time |
| C | ITEM NAME | 2 | Item name |
| D | TIER QTY | 3 | Tier quantity |
| E | QUANTITY | 4 | Actual quantity |
| F | TIER PRICE | 5 | Tier price |
| G | TOTAL PRICE | 6 | Total price |
| H | STATUS | 7 | Request status |

## Key Notes

1. **Stock Management**: CURRENT column (P/15) in ITEMLOG sheet tracks available stock
2. **Request Status**: STATUS column (Y/24) in LOG sheet tracks request status
3. **Item Limits**: LIMIT column (S/18) in ITEMLOG sheet sets admin limits for requests
4. **Log Structure**: LOG sheet stores up to 10 items per request with alternating name/quantity columns
5. **Array Indexing**: Google Apps Script uses 1-based indexing, but documentation shows 0-based for reference