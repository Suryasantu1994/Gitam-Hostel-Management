/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Building } from './types';

export const INITIAL_BUILDINGS: Record<string, Building> = {
  "VS": {
    "id": "VS",
    "name": "Vinay Sadan",
    "abbr": "VS · Boys Hostel",
    "icon": "🏫",
    "colorClass": "vs",
    "genderTag": "👦 Boys",
    "nameClass": "",
    "numClass": "",
    "barClass": "",
    "floors": [
      {
        "floor": 1,
        "rooms": ["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "112", "113", "114", "115", "116", "117", "118", "119", "120", "121", "122", "123", "124", "125", "126", "127", "128", "129", "130", "131", "132"],
        "roomMeta": Object.fromEntries(["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "112", "113", "114", "115", "116", "117", "118", "119", "120", "121", "122", "123", "124", "125", "126", "127", "128", "129", "130", "131", "132"].map(r => [r, { "type": "STANDARD ROOM", "category": "6 SHARING", "capacity": 6, "amenities": ["BED", "BED SHEET", "PILLOW", "PILLOW SLIP", "DOOR MAT", "WRITING TABLE", "CHAIR", "DUSTBIN", "MIRROR", "CURTAIN", "CEILING FAN", "ALMIRAH"] }]))
      },
      {
        "floor": 2,
        "rooms": ["201", "202", "203", "204", "205", "206", "207", "208", "209", "210", "211", "212", "213", "214", "215", "216", "217", "218", "219", "220", "221", "222", "223", "224", "225", "226", "227", "228", "229", "230", "231", "232"],
        "roomMeta": Object.fromEntries(["201", "202", "203", "204", "205", "206", "207", "208", "209", "210", "211", "212", "213", "214", "215", "216", "217", "218", "219", "220", "221", "222", "223", "224", "225", "226", "227", "228", "229", "230", "231", "232"].map(r => [r, { "type": "STANDARD ROOM", "category": "6 SHARING", "capacity": 6, "amenities": ["BED", "BED SHEET", "PILLOW", "PILLOW SLIP", "DOOR MAT", "WRITING TABLE", "CHAIR", "DUSTBIN", "MIRROR", "CURTAIN", "CEILING FAN", "ALMIRAH"] }]))
      },
      {
        "floor": 3,
        "rooms": ["301", "302", "303", "304", "305", "306", "307", "308", "309", "310", "311", "312", "313", "314", "315", "316", "317", "318", "319", "320", "321", "322", "323", "324", "325", "326", "327", "328", "329", "330", "331", "332"],
        "roomMeta": Object.fromEntries(["301", "302", "303", "304", "305", "306", "307", "308", "309", "310", "311", "312", "313", "314", "315", "316", "317", "318", "319", "320", "321", "322", "323", "324", "325", "326", "327", "328", "329", "330", "331", "332"].map(r => [r, { "type": "COMFORT PLUS", "category": "4 SHARING", "capacity": 4, "amenities": ["BED", "BED SHEET", "PILLOW", "PILLOW SLIP", "DOOR MAT", "WRITING TABLE", "CHAIR", "DUSTBIN", "MIRROR", "CURTAIN", "CEILING FAN", "ALMIRAH"] }]))
      },
      {
        "floor": 4,
        "rooms": ["401", "402", "403", "404", "405", "406", "407", "408", "409", "410", "411", "412", "413", "414", "415", "416", "417", "418", "419", "420", "421", "422", "423", "424", "425", "426", "427", "428", "429", "430", "431", "432"],
        "roomMeta": Object.fromEntries(["401", "402", "403", "404", "405", "406", "407", "408", "409", "410", "411", "412", "413", "414", "415", "416", "417", "418", "419", "420", "421", "422", "423", "424", "425", "426", "427", "428", "429", "430", "431", "432"].map(r => [r, { "type": "COMFORT PLUS", "category": "4 SHARING", "capacity": 4, "amenities": ["BED", "BED SHEET", "PILLOW", "PILLOW SLIP", "DOOR MAT", "WRITING TABLE", "CHAIR", "DUSTBIN", "MIRROR", "CURTAIN", "CEILING FAN", "ALMIRAH"] }]))
      },
      {
        "floor": 5,
        "rooms": ["501", "502", "503", "504", "505", "506", "507", "508", "509", "510", "511", "512", "513", "514", "515", "516", "517", "518", "519", "520", "521", "522", "523", "524", "525", "526", "527", "528", "529", "530", "531", "532"],
        "roomMeta": Object.fromEntries(["501", "502", "503", "504", "505", "506", "507", "508", "509", "510", "511", "512", "513", "514", "515", "516", "517", "518", "519", "520", "521", "522", "523", "524", "525", "526", "527", "528", "529", "530", "531", "532"].map(r => [r, { "type": "COMFORT PLUS", "category": "4 SHARING", "capacity": 4, "amenities": ["BED", "BED SHEET", "PILLOW", "PILLOW SLIP", "DOOR MAT", "WRITING TABLE", "CHAIR", "DUSTBIN", "MIRROR", "CURTAIN", "CEILING FAN", "ALMIRAH"] }]))
      },
      {
        "floor": 6,
        "rooms": ["601", "602", "603", "604", "605", "606", "607", "608", "609", "610", "611", "612", "613", "614", "615", "616", "617", "618", "619", "620", "621", "622", "623", "624", "625", "626", "627", "628", "629", "630", "631", "632"],
        "roomMeta": Object.fromEntries(["601", "602", "603", "604", "605", "606", "607", "608", "609", "610", "611", "612", "613", "614", "615", "616", "617", "618", "619", "620", "621", "622", "623", "624", "625", "626", "627", "628", "629", "630", "631", "632"].map(r => [r, { "type": "COMFORT PLUS", "category": "4 SHARING", "capacity": 4, "amenities": ["BED", "BED SHEET", "PILLOW", "PILLOW SLIP", "DOOR MAT", "WRITING TABLE", "CHAIR", "DUSTBIN", "MIRROR", "CURTAIN", "CEILING FAN", "ALMIRAH"] }]))
      },
      {
        "floor": 7,
        "rooms": ["701", "702", "703", "704", "705", "706", "707", "708", "709", "710", "711", "712", "713", "714", "715", "716", "717", "718", "719", "720", "721", "722", "723", "724", "725", "726", "727", "728", "729", "730", "731", "732"],
        "roomMeta": Object.fromEntries(["701", "702", "703", "704", "705", "706", "707", "708", "709", "710", "711", "712", "713", "714", "715", "716", "717", "718", "719", "720", "721", "722", "723", "724", "725", "726", "727", "728", "729", "730", "731", "732"].map(r => [r, { "type": "NON AC ATTACH WASHROOM", "category": "SHARING", "capacity": 2, "amenities": ["BED", "BED SHEET", "PILLOW", "PILLOW SLIP", "DOOR MAT", "WRITING TABLE", "CHAIR", "DUSTBIN", "MIRROR", "CURTAIN", "CEILING FAN", "ALMIRAH"] }]))
      }
    ]
  },
  "SQ": {
    "id": "SQ",
    "name": "Staff Quarters",
    "abbr": "SQ · Student Allotment",
    "icon": "🏠",
    "colorClass": "sq",
    "genderTag": "👤 Mixed",
    "nameClass": "gold-text",
    "numClass": "gold",
    "barClass": "gold-bar",
    "floors": [
      {
        "floor": 4,
        "rooms": ["401", "402", "403", "404", "405", "406", "407", "408"],
        "roomMeta": Object.fromEntries(["401", "402", "403", "404", "405", "406", "407", "408"].map(r => [r, { "type": "COMFORT PLUS", "category": "12 SHARING", "capacity": 12, "amenities": ["BED", "BED SHEET", "PILLOW", "PILLOW SLIP", "DOOR MAT", "WRITING TABLE", "CHAIR", "DUSTBIN", "MIRROR", "CURTAIN", "CEILING FAN", "ALMIRAH"] }]))
      },
      {
        "floor": 5,
        "rooms": ["501", "502", "503", "504", "505", "506", "507", "508"],
        "roomMeta": Object.fromEntries(["501", "502", "503", "504", "505", "506", "507", "508"].map(r => [r, { "type": "COMFORT PLUS", "category": "12 SHARING", "capacity": 12, "amenities": ["BED", "BED SHEET", "PILLOW", "PILLOW SLIP", "DOOR MAT", "WRITING TABLE", "CHAIR", "DUSTBIN", "MIRROR", "CURTAIN", "CEILING FAN", "ALMIRAH"] }]))
      },
      {
        "floor": 6,
        "rooms": ["601", "602", "603", "604", "605", "606", "607", "608"],
        "roomMeta": Object.fromEntries(["601", "602", "603", "604", "605", "606", "607", "608"].map(r => [r, { "type": "COMFORT PLUS", "category": "12 SHARING", "capacity": 12, "amenities": ["BED", "BED SHEET", "PILLOW", "PILLOW SLIP", "DOOR MAT", "WRITING TABLE", "CHAIR", "DUSTBIN", "MIRROR", "CURTAIN", "CEILING FAN", "ALMIRAH"] }]))
      }
    ]
  },
  "NBH": {
    "id": "NBH",
    "name": "North Boys Hostel",
    "abbr": "NBH · Boys Hostel",
    "icon": "🏢",
    "colorClass": "nbh",
    "genderTag": "👦 Boys",
    "nameClass": "indigo-text",
    "numClass": "indigo",
    "barClass": "indigo-bar",
    "floors": [
      {
        "floor": 1,
        "rooms": Array.from({length: 42}, (_, i) => String(101 + i)),
        "roomMeta": Object.fromEntries(Array.from({length: 42}, (_, i) => String(101 + i)).map(r => [r, { "type": "COMFORT ROOM", "category": "3 SHARING", "capacity": 3, "amenities": ["BED", "BED SHEET", "BED COVER", "PILLOW", "PILLOW COVER", "DOOR MAT", "DUSTBIN", "CURTAIN", "WALL MOUNT FAN", "WRITING TABLE", "CHAIR", "WARDROBE", "SHOE RACK", "CEILING FAN", "WARDROBE MIRROR"] }]))
      },
      {
        "floor": 2,
        "rooms": Array.from({length: 42}, (_, i) => String(201 + i)),
        "roomMeta": Object.fromEntries(Array.from({length: 42}, (_, i) => String(201 + i)).map(r => [r, { "type": "COMFORT ROOM", "category": "3 SHARING", "capacity": 3, "amenities": ["BED", "BED SHEET", "BED COVER", "PILLOW", "PILLOW COVER", "DOOR MAT", "DUSTBIN", "CURTAIN", "WALL MOUNT FAN", "WRITING TABLE", "CHAIR", "WARDROBE", "SHOE RACK", "CEILING FAN", "WARDROBE MIRROR"] }]))
      },
      {
        "floor": 11,
        "rooms": Array.from({length: 30}, (_, i) => String(1101 + i)),
        "roomMeta": Object.fromEntries(Array.from({length: 30}, (_, i) => String(1101 + i)).map(r => [r, { "type": "PREMIER ROOM", "category": "TWIN BED", "capacity": 2, "amenities": [] }]))
      }
    ]
  },
  "SBH": {
    "id": "SBH",
    "name": "South Girls Hostel",
    "abbr": "SBH · Girls Hostel",
    "icon": "🏗",
    "colorClass": "sbh",
    "genderTag": "👧 Girls",
    "nameClass": "rose-text",
    "numClass": "rose",
    "barClass": "rose-bar",
    "floors": [
      {
        "floor": 1,
        "rooms": Array.from({length: 48}, (_, i) => String(101 + i)),
        "roomMeta": Object.fromEntries(Array.from({length: 48}, (_, i) => String(101 + i)).map(r => [r, { "type": "STANDARD ROOM", "category": "4 SHARING", "capacity": 4, "amenities": ["BED", "BED SHEET", "PILLOW", "PILLOW SLIP", "DOOR MAT", "WRITING TABLE", "CHAIR", "DUSTBIN", "MIRROR", "CURTAIN", "CEILING FAN", "ALMIRAH"] }]))
      }
    ]
  }
};
