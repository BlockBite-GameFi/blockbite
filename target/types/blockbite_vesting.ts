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
        "Back-compat alias for the W4 instruction name. Calls cancel_stream."
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
          "name": "beneficiary"
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
          "docs": [
            "Creator's ATA — receives unvested portion"
          ],
          "writable": true
        },
        {
          "name": "beneficiaryAta",
          "docs": [
            "Beneficiary's ATA — receives vested-but-unclaimed portion"
          ],
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
      "name": "cancelStream",
      "docs": [
        "Creator cancels stream.",
        "Already-vested but unclaimed tokens go to the beneficiary.",
        "Truly unvested tokens return to the creator.",
        "",
        "Acceptance criteria covered:",
        "- Only creator can cancel              → Unauthorized",
        "- Cannot cancel already-cancelled      → AlreadyCancelled",
        "- Cannot cancel a fully-vested stream  → FullyVested",
        "- Stream past end_ts with no withdraw  → StreamExpired (info, not blocking)"
      ],
      "discriminator": [
        218,
        221,
        38,
        25,
        177,
        207,
        188,
        91
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "beneficiary"
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
          "docs": [
            "Creator's ATA — receives unvested portion"
          ],
          "writable": true
        },
        {
          "name": "beneficiaryAta",
          "docs": [
            "Beneficiary's ATA — receives vested-but-unclaimed portion"
          ],
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
      "name": "createMilestoneStream",
      "docs": [
        "W5 entry — same as create_stream but the resulting stream is",
        "milestone-gated. `unlocked_amount` returns 0 until the creator",
        "calls `set_milestone(met=true)` regardless of how much time has",
        "elapsed. Once the milestone is flipped, the time curve resumes."
      ],
      "discriminator": [
        162,
        112,
        235,
        171,
        104,
        156,
        63,
        203
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
      "name": "createStream",
      "docs": [
        "W4 entry — Lock `amount` tokens with linear+cliff vesting only.",
        "Signature is byte-identical to Week 4 so the W4 test suite keeps",
        "passing. New milestone-aware streams go through",
        "`create_milestone_stream` below."
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
      "name": "setMilestone",
      "docs": [
        "Milestone-based vesting (W5 spec).",
        "When `milestone_required == true`, `unlocked_amount` returns 0 until",
        "the creator flips `milestone_met` via this instruction. After the flag",
        "is set the time-based curve (cliff + linear) resumes normally.",
        "",
        "Idempotent: calling on an already-met milestone is a no-op success.",
        "Only the creator may flip the flag."
      ],
      "discriminator": [
        174,
        213,
        91,
        82,
        156,
        42,
        105,
        3
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
        }
      ],
      "args": [
        {
          "name": "met",
          "type": "bool"
        }
      ]
    },
    {
      "name": "withdraw",
      "docs": [
        "Beneficiary claims however many tokens have vested since last withdrawal.",
        "VGPV: blocks withdrawals issued faster than 2 hr apart after 3 strikes."
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
      "name": "milestoneSet",
      "discriminator": [
        18,
        247,
        244,
        42,
        211,
        18,
        157,
        101
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
      "name": "overflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6004,
      "name": "velocityViolation",
      "msg": "Velocity exceeds human threshold — VGPV violation"
    },
    {
      "code": 6005,
      "name": "unauthorized",
      "msg": "Caller is not authorized for this action"
    },
    {
      "code": 6006,
      "name": "alreadyCancelled",
      "msg": "Stream has already been cancelled"
    },
    {
      "code": 6007,
      "name": "fullyVested",
      "msg": "Stream is fully vested — nothing left to cancel"
    },
    {
      "code": 6008,
      "name": "nothingToWithdraw",
      "msg": "Nothing available to withdraw yet"
    },
    {
      "code": 6009,
      "name": "streamExpired",
      "msg": "Stream end time has passed"
    },
    {
      "code": 6010,
      "name": "milestoneNotApplicable",
      "msg": "This stream is not configured for milestone vesting"
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
      "name": "milestoneSet",
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
            "name": "previous",
            "type": "bool"
          },
          {
            "name": "current",
            "type": "bool"
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
          },
          {
            "name": "milestoneRequired",
            "type": "bool"
          },
          {
            "name": "milestoneMet",
            "type": "bool"
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
          },
          {
            "name": "milestoneRequired",
            "type": "bool"
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
