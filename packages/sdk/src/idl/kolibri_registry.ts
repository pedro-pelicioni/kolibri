/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/kolibri_registry.json`.
 */
export type KolibriRegistry = {
  "address": "Bybi3nTRCF1CU15BvwLnMA4B27YGs5BuoVXeFzFxfqnF",
  "metadata": {
    "name": "kolibriRegistry",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Kolibri — registro de rastreabilidade (PoE) + NFT das plantas na Solana"
  },
  "docs": [
    "Kolibri Registry — Proof-of-Existence da rastreabilidade da planta.",
    "",
    "Cada planta/lote vira um PDA `Batch` (1 por planta), namespaced pelo dispensário.",
    "O registro ancora o `sha256(payload de origem)` (raiz PoE) e cada evento ancora o",
    "`sha256(payload canônico)` (calculado off-chain). O PDA guarda o hash do evento",
    "mais recente + a contagem; cada hash é emitido no log `EventRecorded`. O payload",
    "completo fica off-chain; on-chain só trafegam hashes + storage_uri (sem PII).",
    "",
    "Custódia: a `authority` é a keypair de serviço (server-custody) que assina e grava",
    "os eventos. O `dispensary` é a wallet do dispensário (verificada via SIWS) — dono do",
    "NFT Metaplex Core e âncora de proveniência. O NFT é mintado off-chain (API via umi)",
    "e vinculado on-chain por `set_asset`."
  ],
  "instructions": [
    {
      "name": "recordEvent",
      "discriminator": [
        32,
        2,
        109,
        205,
        6,
        116,
        72,
        229
      ],
      "accounts": [
        {
          "name": "batch",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "eventType",
          "type": "u8"
        },
        {
          "name": "payloadHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "storageUri",
          "type": "string"
        }
      ]
    },
    {
      "name": "registerPlant",
      "discriminator": [
        149,
        99,
        223,
        0,
        224,
        122,
        214,
        243
      ],
      "accounts": [
        {
          "name": "batch",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  116,
                  99,
                  104
                ]
              },
              {
                "kind": "arg",
                "path": "dispensary"
              },
              {
                "kind": "arg",
                "path": "batchId"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "batchId",
          "type": {
            "array": [
              "u8",
              16
            ]
          }
        },
        {
          "name": "dispensary",
          "type": "pubkey"
        },
        {
          "name": "originEventType",
          "type": "u8"
        },
        {
          "name": "originHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "storageUri",
          "type": "string"
        }
      ]
    },
    {
      "name": "setAsset",
      "docs": [
        "Vincula o NFT Metaplex Core (mintado off-chain pela API) a este lote."
      ],
      "discriminator": [
        243,
        216,
        48,
        30,
        63,
        58,
        91,
        239
      ],
      "accounts": [
        {
          "name": "batch",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "asset",
          "type": "pubkey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "batch",
      "discriminator": [
        156,
        194,
        70,
        44,
        22,
        88,
        137,
        44
      ]
    }
  ],
  "events": [
    {
      "name": "assetBound",
      "discriminator": [
        100,
        222,
        160,
        40,
        46,
        158,
        49,
        213
      ]
    },
    {
      "name": "batchRegistered",
      "discriminator": [
        125,
        239,
        216,
        76,
        8,
        32,
        199,
        204
      ]
    },
    {
      "name": "eventRecorded",
      "discriminator": [
        144,
        99,
        40,
        235,
        220,
        157,
        153,
        13
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidEventType",
      "msg": "Tipo de evento inválido (deve ser 1..15)"
    },
    {
      "code": 6001,
      "name": "uriTooLong",
      "msg": "storage_uri muito longa"
    },
    {
      "code": 6002,
      "name": "unauthorized",
      "msg": "Authority não autorizada para este lote"
    },
    {
      "code": 6003,
      "name": "overflow",
      "msg": "Overflow no contador de eventos"
    }
  ],
  "types": [
    {
      "name": "assetBound",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "batchId",
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          },
          {
            "name": "asset",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "batch",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "Keypair de serviço (server-custody) — assina e grava eventos."
            ],
            "type": "pubkey"
          },
          {
            "name": "dispensary",
            "docs": [
              "Wallet do dispensário (SIWS) — dono do NFT e proveniência. Usada no seed do PDA."
            ],
            "type": "pubkey"
          },
          {
            "name": "batchId",
            "docs": [
              "ULID em bytes (round-trip com a string do DB/UI)."
            ],
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          },
          {
            "name": "originEventType",
            "type": "u8"
          },
          {
            "name": "originHash",
            "docs": [
              "sha256 do payload de origem = raiz PoE."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "eventCount",
            "type": "u64"
          },
          {
            "name": "lastEventHash",
            "docs": [
              "Hash (sha256) do payload do evento mais recente."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "status",
            "docs": [
              "0 = Active, 1 = Recalled, 2 = Destroyed."
            ],
            "type": "u8"
          },
          {
            "name": "asset",
            "docs": [
              "NFT Metaplex Core desta planta (Pubkey::default até ser vinculado)."
            ],
            "type": "pubkey"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "batchRegistered",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "batchId",
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "dispensary",
            "type": "pubkey"
          },
          {
            "name": "originEventType",
            "type": "u8"
          },
          {
            "name": "originHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "storageUri",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "eventRecorded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "batchId",
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          },
          {
            "name": "eventType",
            "type": "u8"
          },
          {
            "name": "payloadHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "storageUri",
            "type": "string"
          },
          {
            "name": "index",
            "type": "u64"
          },
          {
            "name": "lastEventHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    }
  ]
};
