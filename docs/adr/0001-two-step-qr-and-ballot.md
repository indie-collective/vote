# Two-step voting: a fresh QR scan grants a short-lived Ballot

Votes must come from visitors physically at the stand, so a photo of the Host Screen shared on social media must stop working almost immediately. A single QR link valid for the whole voting time (the old design: 2 minutes) can't do both, because slow voters need minutes but a shared link must die in seconds. So we split it: a QR code is only accepted if opened within ~20 s of being shown, and opening it grants a Ballot (a signed cookie) that allows exactly one Vote within ~3 minutes. Each Vote records its Ballot's id with a uniqueness constraint, so the server enforces one Vote per Ballot.

## Considered Options

- **Single-use QR codes**: rejected. Several people often scan the same code at once.
- **One person, one vote enforced on the server (wristband codes, phone checks)**: rejected. Too much hassle at the stand for an audience prize.
- **Limiting votes per IP address**: rejected. Festival Wi-Fi puts most visitors behind one shared address.

## Consequences

A visitor can still vote again by re-scanning in a private window. That casual protection is accepted on purpose (the "voted" cookie only stops honest repeats).
