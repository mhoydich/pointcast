# Trace · Public gallery link acceptance

Status: proposed checks, pending execution.

| Check | Procedure | Pass condition |
| --- | --- | --- |
| 1. Published link | Follow the exact link from the draft announcement and record the final URL and response status. | The link opens the intended HTTPS gallery URL with HTTP 200. Any redirects end on the expected public host. |
| 2. Anonymous access | Paste the link into a fresh private window with no active sign-in and open an item. | Both gallery and item are visible without an account, invitation, or access request. |
| 3. Correct release | Compare the rendered gallery heading and item list with the release manifest. | The heading, roster count, and item identities match the intended release. |
| 4. Item assets | Walk the published roster and open each portrait or item detail from its card. | Every referenced asset loads, and each card points to the corresponding item. |
| 5. Direct return | Copy a public item URL, open it in a second fresh session, and use its gallery return link. | The copied URL opens the same item directly, and the return link reaches the public gallery. |

For each check, record the URL, the time in UTC, the result, and a screenshot or response detail that supports it.
