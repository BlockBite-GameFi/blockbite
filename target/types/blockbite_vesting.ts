/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/blockbite_vesting.json`.
 */
export type BlockbiteVesting = {
  "address": "DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf",
  "metadata": {
    "name": "blockbiteVesting",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "BlockBite token vesting — linear unlock with partial withdrawal on Solana devnet"
  },
  "instructions": [
    {
      "name": "cancel",
      "docs": [
        "Creator cancels stream: remaining unvested tokens return to creator."
      ],
      "discriminator": [
        232,
        219,
        223,
        41,
        219,
        236,
        220,
        190
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "stream",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  101,
                  97,
                  109
                ]
              },
              {
                "kind": "account",
                "path": "stream.authority",
                "account": "streamAccount"
              },
              {
                "kind": "account",
                "path": "stream.stream_id",
                "account": "streamAccount"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "stream.authority",
                "account": "streamAccount"
              },
              {
                "kind": "account",
                "path": "stream.stream_id",
                "account": "streamAccount"
              }
            ]
          }
        },
        {
          "name": "authorityAta",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "createStream",
      "docs": [
        "Lock `amount` tokens from creator into a PDA vault.",
        "Vesting is linear from `start_ts` to `end_ts`.",
        "`cliff_ts = 0` means no cliff (behaves as start_ts).",
        "Pass cliff_ts between start_ts and end_ts to enforce a cliff period."
      ],
      "discriminator": [
        71,
        188,
        111,
        127,
        108,
        40,
        229,
        158
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "beneficiary"
        },
        {
          "name": "mint"
        },
        {
          "name": "stream",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  101,
                  97,
                  109
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "arg",
                "path": "streamId"
              }
            ]
          }
        },
        {
          "name": "vault",
          "docs": [
            "PDA token account; authority = stream PDA so withdraw can sign via seeds."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "arg",
                "path": "streamId"
              }
            ]
          }
        },
        {
          "name": "authorityAta",
          "docs": [
            "Creator's token account to debit."
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "streamId",
          "type": "u64"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "startTs",
          "type": "i64"
        },
        {
          "name": "cliffTs",
          "type": "i64"
        },
        {
          "name": "endTs",
          "type": "i64"
        }
      ]
    },
    {
      "name": "withdraw",
      "docs": [
        "Beneficiary claims however many tokens have vested since last withdrawal.",
        "VGPV: tracks withdrawal velocity; enforcement logic added in W5."
      ],
      "discriminator": [
        183,
        18,
        70,
        156,
        148,
        109,
        161,
        34
      ],
      "accounts": [
        {
          "name": "beneficiary",
          "signer": true
        },
        {
          "name": "stream",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  101,
                  97,
                  109
                ]
              },
              {
                "kind": "account",
                "path": "stream.authority",
                "account": "streamAccount"
              },
              {
                "kind": "account",
                "path": "stream.stream_id",
                "account": "streamAccount"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "stream.authority",
                "account": "streamAccount"
              },
              {
                "kind": "account",
                "path": "stream.stream_id",
                "account": "streamAccount"
              }
            ]
          }
        },
        {
          "name": "beneficiaryAta",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "streamAccount",
      "discriminator": [
        243,
        60,
        164,
        106,
        199,
        192,
        110,
        53
      ]
    }
  ],
  "events": [
    {
      "name": "cancelled",
      "discriminator": [
        136,
        23,
        42,
        65,
        143,
        233,
        234,
        46
      ]
    },
    {
      "name": "streamCreated",
      "discriminator": [
        93,
        150,
        91,
        15,
        166,
        8,
        251,
        166
      ]
    },
    {
      "name": "withdrawn",
      "discriminator": [
        20,
        89,
        223,
        198,
        194,
        124,
        219,
        13
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "zeroAmount",
      "msg": "Amount must be greater than zero"
    },
    {
      "code": 6001,
      "name": "invalidTimeRange",
      "msg": "end_ts must be strictly after start_ts"
    },
    {
      "code": 6002,
      "name": "invalidCliff",
      "msg": "cliff_ts must be between start_ts and end_ts (or 0 for no cliff)"
    },
    {
      "code": 6003,
      "name": "nothingToWithdraw",
      "msg": "Nothing available to withdraw yet"
    },
    {
      "code": 6004,
      "name": "unauthorized",
      "msg": "Caller is not authorized for this action"
    },
    {
      "code": 6005,
      "name": "streamCancelled",
      "msg": "Stream has already been cancelled"
    },
    {
      "code": 6006,
      "name": "overflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6007,
      "name": "velocityViolation",
      "msg": "Velocity exceeds human threshold — VGPV violation (enforced W5)"
    }
  ],
  "types": [
    {
      "name": "cancelled",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "stream",
            "type": "pubkey"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "refunded",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "streamAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "beneficiary",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "amountTotal",
            "type": "u64"
          },
          {
            "name": "amountWithdrawn",
            "type": "u64"
          },
          {
            "name": "startTs",
            "type": "i64"
          },
          {
            "name": "cliffTs",
            "type": "i64"
          },
          {
            "name": "endTs",
            "type": "i64"
          },
          {
            "name": "streamId",
            "type": "u64"
          },
          {
            "name": "cancelled",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "velocityStrikes",
            "type": "u8"
          },
          {
            "name": "lastActionTs",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "streamCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "stream",
            "type": "pubkey"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "beneficiary",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "startTs",
            "type": "i64"
          },
          {
            "name": "cliffTs",
            "type": "i64"
          },
          {
            "name": "endTs",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "withdrawn",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "stream",
            "type": "pubkey"
          },
          {
            "name": "beneficiary",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    }
  ]
};
