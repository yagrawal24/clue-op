# Smart Features & Deduction Logic Summary

## Overview

This Clue game assistant implements a sophisticated real-time inference engine that automatically deduces card ownership, tracks game state, and provides strategic AI advice. The system uses constraint satisfaction, cross-referencing, and card count inference to make intelligent deductions.

---

## Core Data Structures

### 1. Knowledge Matrix (`KnowledgeMatrix`)

A comprehensive tracking system where each card has states for:

-   **Each player**: `unknown`, `owned`, `not_owned`, `potentially_owned`
-   **Envelope**: `unknown`, `envelope`, `not_owned`

**Location**: `src/lib/types.ts` (lines 86-92)

### 2. Card Links (`CardLink`)

Tracks unresolved "showed one of these cards" constraints:

-   Links a player to multiple possible cards from a suggestion
-   Resolved when only one card remains possible
-   Used for cross-suggestion inference

**Location**: `src/lib/types.ts` (lines 26-34)

### 3. Deductions (`Deduction`)

Records all automatic and manual deductions with:

-   Type: `card_owned`, `card_not_owned`, `envelope`, `link_resolved`, `cross_reference`, `card_count`, `manual_adjustment`
-   Description, timestamp, and source suggestion tracking

**Location**: `src/lib/types.ts` (lines 73-84)

---

## Inference Engine Rules (`runInference`)

**Location**: `src/store/gameStore.ts` (lines 569-1079)

The inference engine runs iteratively (up to 100 iterations) until no more deductions can be made. It applies the following rules:

### Rule 0: Link Update

-   Updates unresolved card links by filtering out cards that are now known to be `not_owned`
-   Handles cross-suggestion scenarios where a player showed in one suggestion but passed in another

**Code**: Lines 592-606

### Rule 1: Link Resolution

-   When only one card remains possible in a link, automatically resolves it
-   Marks that card as `owned` by the player
-   Creates a `link_resolved` deduction

**Code**: Lines 608-649

### Rule 1.5: Cross-Suggestion Inference (Advanced)

**The most sophisticated deduction pattern:**

If Player P showed a card from {A, B, C} in Turn X, and later passed on {A, B, D} in Turn Y:

-   P must not have A or B (from the pass)
-   Therefore, P showed C in Turn X

**Implementation**:

-   Compares all show events with all pass events for the same player
-   Finds cards that appear in the show but NOT in the pass
-   If exactly one card matches, deduces ownership

**Code**: Lines 651-709

### Rule 1.6: Multiple Link Intersection

-   Tracks multiple unresolved links for the same player
-   Finds intersections between link sets
-   Helps identify cards shown in multiple suggestions

**Code**: Lines 711-754

### Rule 2: Process of Elimination

-   If all but one player is ruled out for a card, and it's not in the envelope
-   The remaining player must have it

**Code**: Lines 756-783

### Rule 2.5: Propagate Not-Owned from Passes

-   When a player passes on a suggestion, updates `potentially_owned` to `not_owned`
-   Ensures pass information is properly propagated

**Code**: Lines 785-799

### Rule 3: Envelope by Elimination

-   If ALL players are confirmed as `not_owned` for a card
-   That card must be in the envelope

**Code**: Lines 801-826

### Rule 4: Envelope Type Constraint

-   Each card type (suspect, weapon, room) has exactly ONE card in the envelope
-   If one card of a type is confirmed in envelope, mark others as `not_owned`

**Code**: Lines 828-841

### Rule 5: Last Unknown Card Inference

-   If only one unknown card of a type remains and it's not owned by anyone
-   It must be in the envelope

**Code**: Lines 843-880

### Rule 6: Card Count Inference (Enhanced)

Uses knowledge of how many cards each player has:

#### Rule 6a: Exact Match

-   If remaining slots = number of possible cards
-   Player must have all of them

**Code**: Lines 909-935

#### Rule 6b: Full Hand Detection

-   If player has all their cards confirmed
-   Mark everything else as `not_owned`

**Code**: Lines 937-956

#### Rule 6c: Constraint-Based Inference

-   If player has eliminated max possible cards they can't have
-   Any remaining `potentially_owned` cards must be `owned`

**Code**: Lines 958-991

#### Rule 6d: Cross-Player Card Count Constraint

-   If exactly one player can have a card (based on their remaining slots)
-   And envelope can't have it
-   That player must have it

**Code**: Lines 993-1042

### Rule 7: Ownership Propagation

-   When a card is confirmed as `owned` by a player
-   Automatically marks all other players as `not_owned`
-   Marks envelope as `not_owned`

**Code**: Lines 1044-1063

---

## Suggestion Processing Logic

**Location**: `src/store/gameStore.ts` (lines 249-366)

### When Recording a Suggestion:

1. **Process Passes** (Lines 273-289)

    - For each player who passed:
        - Mark all 3 suggested cards as `not_owned` for that player
        - Create `card_not_owned` deductions
        - Updates `potentially_owned` to `not_owned` (crucial for cross-suggestion deductions)

2. **Process Shows** (Lines 292-354)

    - **If card is known**:

        - Mark as `owned` by the shower
        - Mark envelope as `not_owned`
        - Mark other players as `not_owned`

    - **If card is unknown**:
        - Create a `CardLink` with all possible cards
        - Mark those cards as `potentially_owned`
        - Track which suggestion(s) link to each card

3. **Run Inference** (Line 365)
    - Automatically triggers the inference engine after each suggestion

---

## Manual Override System

**Location**: `src/store/gameStore.ts` (lines 368-480)

### `setCardState` Function:

-   Allows manual marking of card states
-   Handles state transitions intelligently:
    -   Marking as `owned` → marks others as `not_owned`
    -   Marking as `envelope` → marks all players as `not_owned`
    -   Cycling back to `unknown` → resets related states appropriately
-   Creates `manual_adjustment` deductions
-   Automatically triggers inference after changes

---

## AI Advisor Integration

**Location**: `src/app/api/advisor/route.ts`

### Context Building (`buildGameStateContext`)

Creates a comprehensive text summary including:

-   Solved envelope cards
-   Possible solution candidates by type
-   Per-player card ownership (owned, not owned, potentially owned)
-   Suggestion history with passes and shows
-   Unresolved card links
-   Recent deductions log

**Code**: Lines 28-168

### AI Prompt Engineering

The system instruction teaches the AI about:

-   Advanced deduction patterns (cross-reference, card count, link intersection)
-   Game rules and constraints
-   Strategic suggestion strategies
-   Bluff detection

**Code**: Lines 184-207

### Features:

-   **Strategic Advice**: Recommends next suggestion based on game state
-   **Key Insights**: Highlights most important information
-   **Threat Assessment**: Identifies players close to winning
-   **Custom Questions**: Answers specific player questions

---

## UI Components

### 1. Master Matrix (`MasterMatrix.tsx`)

-   Visual representation of the knowledge matrix
-   Color-coded cells for each state
-   Clickable cells for manual overrides
-   Shows card counts per player
-   Collapsible sections by card type
-   Clear row functionality

### 2. Intelligence Panel (`IntelligencePanel.tsx`)

-   Displays solution progress (suspect/weapon/room)
-   Shows deduction statistics
-   Lists recent deductions with icons
-   Warns about unresolved links
-   Color-coded deduction types

### 3. AI Advisor (`AIAdvisor.tsx`)

-   Button to trigger AI analysis
-   Displays formatted AI responses
-   Custom question input
-   Game stats summary
-   Error handling

---

## Key Smart Features Summary

### 1. **Automatic Deduction Engine**

-   Runs after every suggestion, manual change, or card assignment
-   Iterative inference until convergence
-   Handles complex multi-step deductions

### 2. **Cross-Suggestion Inference**

-   Most advanced feature: compares shows vs passes across turns
-   Automatically resolves which card was shown
-   Creates `cross_reference` deductions

### 3. **Card Count Constraints**

-   Uses player card counts for sophisticated elimination
-   Detects when players have full hands
-   Identifies sole possible owners based on remaining slots

### 4. **Link Resolution System**

-   Tracks unresolved "one of these cards" constraints
-   Automatically resolves when only one option remains
-   Updates links as new information arrives

### 5. **Envelope Deduction**

-   Multiple methods to identify envelope cards:
    -   All players eliminated → envelope
    -   Last unknown of type → envelope
    -   Type constraint enforcement

### 6. **State Propagation**

-   Ownership automatically propagates to other players
-   Pass information updates potentially_owned states
-   Envelope constraints propagate to card types

### 7. **Deduction Tracking**

-   Every deduction is logged with:
    -   Type, description, timestamp
    -   Source suggestion (if applicable)
    -   Previous state (for manual adjustments)

### 8. **AI Strategic Analysis**

-   Context-aware game state summarization
-   Strategic suggestion recommendations
-   Threat assessment
-   Custom question answering

---

## Technical Implementation Details

### Iterative Inference

-   Maximum 100 iterations to prevent infinite loops
-   Stops when no changes occur (`changed = false`)
-   Deep copies matrix and links to avoid mutation issues

### State Management

-   Uses Zustand with persistence
-   Deep copying for matrix updates
-   Immutable state updates

### Performance

-   Efficient filtering and mapping operations
-   Early returns for resolved links
-   Optimized card lookups using helper functions

---

## Example Deduction Flow

1. **Turn 1**: Alice suggests "Scarlett + Dagger + Kitchen"

    - Bob passes → System marks Bob as `not_owned` for all 3 cards
    - Carol shows (unknown card) → Creates link: Carol has one of {Scarlett, Dagger, Kitchen}

2. **Turn 2**: David suggests "Scarlett + Rope + Hall"

    - Carol passes → System marks Carol as `not_owned` for {Scarlett, Rope, Hall}
    - **Cross-reference deduction**: Carol showed Dagger or Kitchen in Turn 1 (not Scarlett)

3. **Turn 3**: Alice suggests "Plum + Dagger + Library"

    - Carol shows (unknown card) → Creates link: Carol has one of {Plum, Dagger, Library}
    - **Link intersection**: Carol has Dagger (appears in both links)

4. **Automatic Resolution**: System resolves Carol's Turn 1 link → Carol owns Dagger
    - Creates `link_resolved` deduction
    - Marks Dagger as `not_owned` for all other players
    - Marks Dagger as `not_owned` for envelope

---

## Future Enhancement Opportunities

1. **Probability Calculations**: Track likelihood of cards being in envelope
2. **Bluff Detection**: Identify when players might be bluffing
3. **Suggestion Optimization**: Suggest combinations that maximize information gain
4. **Pattern Recognition**: Detect player strategies and tendencies
5. **Multi-Game Learning**: Learn from multiple games to improve suggestions

---

## Files Involved

-   **Core Logic**: `src/store/gameStore.ts` (1101 lines)
-   **Type Definitions**: `src/lib/types.ts` (215 lines)
-   **AI API**: `src/app/api/advisor/route.ts` (267 lines)
-   **UI Components**:
    -   `src/components/MasterMatrix.tsx` (469 lines)
    -   `src/components/IntelligencePanel.tsx` (272 lines)
    -   `src/components/AIAdvisor.tsx` (304 lines)

**Total Smart Logic Code**: ~2,600+ lines
