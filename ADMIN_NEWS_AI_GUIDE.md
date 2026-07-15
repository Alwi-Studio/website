# Admin News AI Guide

Use this guide to generate news posts for the AlwiNation admin panel.

## Output Format

When asking an AI to draft a news post, ask it to return these fields:

```md
Title:

Description:

Category:

Date:

Author:

Reading Time:

Image URL:

Highlights:
- 
- 
- 

Body:
```

Paste each field into the matching admin panel field. The slug is generated from the title.

## Field Rules

- Title: Required. Keep it clear and specific.
- Description: Required. This appears on news cards and should be 1 short sentence.
- Category: Use a short label such as `Announcement`, `Update`, `Event`, `Patch Notes`, or `Community`.
- Date: Use the admin date picker.
- Author: Usually `AlwiNation Team`.
- Reading Time: Usually `2 min read`, `3 min read`, or `5 min read`.
- Image URL: Optional. Must be a direct image URL starting with `http://` or `https://`.
- Highlights: One short highlight per line. Maximum 12 highlights.
- Body: Required. Use the supported article syntax below.

## Body Syntax

### Inline Text

```md
**bold**
*italic*
__underline__
~~strike~~
`inline code`
[link text](https://alwination.id)
||spoiler text||
```

### Headings

```md
# Main section
## Subsection
### Small heading
```

### Lists

```md
- First point
- Second point
* Third point
```

### Checklists

```md
- [x] Spawn area prepared
- [ ] Rewards configured
- [ ] Announcement posted
```

### Tables

```md
| Rank | Price | Perks |
| --- | ---: | --- |
| VIP | $5 | Cosmetics |
| MVP | $10 | Cosmetics + kits |
```

### Images

Put image syntax on its own line. Add optional caption text after the URL.

```md
![Spawn preview](https://example.com/spawn.webp) Optional caption text
```

### Quotes

```md
> The server update is planned for this weekend.
> Keep an eye on Discord for the exact time.
> -- AlwiNation Team
```

### Code Blocks

````md
```yaml
server: alwination
mode: survival
```
````

### Callouts

```md
:::callout Important
Restart your launcher before joining.
:::
```

### Stats

Each stat line must use `Label: Value`.

```md
:::stats
Players online: 120
Version: 1.21.11
Database-ready: Yes
:::
```

### Columns Or Grid

Use `columns` or `grid`, followed by 2, 3, or 4.

```md
:::columns 2
Survival | Claim land, build bases, and trade.
Events | Join seasonal contests and tournaments.
:::
```

### Cards

```md
:::cards
VIP | Cosmetic perks and chat color. | Store
MVP | Extra kits and profile flair. | Popular
:::
```

### Tabs

```md
:::tabs
Java | Join with play.alwination.id on Minecraft Java.
Bedrock | Join with the Bedrock address and port from Discord.
:::
```

### Accordion

```md
:::accordion
Can I transfer ranks? | Open a ticket with your username and proof.
Where do I report bugs? | Use Discord support and include screenshots.
:::
```

Use a titled collapse when its body needs full block formatting such as headings, lists, tables, images, code, or another fenced block:

```md
:::collapse Server versions
| Edition | Version |
| --- | --- |
| Java | 1.21+ |
| Bedrock | Latest |
:::
```

### Sections And Containers

```md
:::section Launch notes
This area introduces a new part of the article.
:::

:::container Important links
Use this for grouped links or short reminders.
:::
```

### Sidebar

Put `---` between the main text and sidebar text.

```md
:::sidebar Quick reminder
Main explanation goes here.
---
Side note, requirement, or warning goes here.
:::
```

## AI Prompt Template

```md
Create an AlwiNation admin news post using this exact field format:

Title:
Description:
Category:
Date:
Author:
Reading Time:
Image URL:
Highlights:
- 
- 
- 
Body:

Rules:
- Write for a Minecraft server/community audience.
- Keep the description to 1 short sentence.
- Use 3 to 6 highlights, one per line.
- Use supported body syntax only: headings, paragraphs, lists, checklists, tables, images, quotes, callouts, stats, cards, tabs, accordion, sections, containers, sidebar, and fenced code blocks.
- Do not include unsupported HTML.
- Do not invent URLs unless I provide them.
- Make the body readable, structured, and ready to paste into the admin Body field.

Topic:
[Describe the news post here]

Facts to include:
- [Fact 1]
- [Fact 2]
- [Fact 3]
```

## Example News Post

```md
Title:
Survival Season Update

Description:
New survival changes are coming with refreshed rewards, cleaner progression, and better event support.

Category:
Update

Date:
July 2026

Author:
AlwiNation Team

Reading Time:
3 min read

Image URL:
https://example.com/news-image.webp

Highlights:
- Refreshed survival progression
- Event rewards prepared
- Spawn improvements planned

Body:
# Survival Season Update

The next survival update focuses on cleaner progression, better rewards, and a smoother start for new players.

:::callout Important
Some features may be adjusted before release based on testing and player feedback.
:::

## What's changing

- Spawn paths are being cleaned up.
- Early-game rewards are being reviewed.
- Event support is being prepared for future announcements.

:::stats
Focus areas: 3
Status: In progress
Release window: Coming soon
:::

## Preparation checklist

- [x] Review player feedback
- [ ] Finalize reward values
- [ ] Publish event schedule

> Thanks for helping us shape the next update.
> -- AlwiNation Team
```
