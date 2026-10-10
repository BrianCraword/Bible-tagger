# Factory configuration — Bible-tagger

AUTO_MERGE: off
DEFAULT_BRANCH: main
BOARD: none
MAX_REWORK_ROUNDS: 2

## Why AUTO_MERGE is off

This pipeline runs static checks only. No Discourse instance boots the code before the
approver decides. "Four agents read it" is not "it works," and the approver must never
imply otherwise.

Turn AUTO_MERGE on only after a dev or staging Discourse instance runs the branch and
the plugin specs pass — and then only for classes of change listed below.

AUTO_MERGE_ALLOWED_WHEN: (none yet)

## Always escalate, regardless of AUTO_MERGE

- database migrations
- group or permission changes
- identity verification paths
- AI persona prompts
- route changes
- site settings
- dependency changes
- anything touching vc-canvas
- anything in discourse-matchmaking until v0.13/0.14 are deployed