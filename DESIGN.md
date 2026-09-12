# Assembly studio

Mode: Operate. A light model-making bench: warm off-white canvas, ink typography, olive active controls, orange selection. The assembly owns most of the viewport. Parts hierarchy at left; dimensional inspection at right. Dense data uses tabular numerals. Controls stay ordinary buttons, checkboxes and sliders.

The user delegated the stack and visual direction and requested a direct build. Considered systems: engineering drawing, parts catalogue, camera workbench, flight checklist, model-making bench, service manual, fabrication traveler. Selected model-making bench. Map legend contributes explicit symbols; oscilloscope contributes measured scale; folding sheet contributes reversible explosion. Game sprites, typographic storms and scroller queues undermine dimensional clarity and are declined.

Tokens: canvas #ecede7; paper #f8f9f5; ink #242923; secondary #60665c; rule #d6d9cf; active #455a37; highlight #c66935. Inter Variable, 13px body baseline; 28px scene heading (weight 450), 15px header title (weight 500), 23px brand. Controls generally use 11px, metadata 9–10px. Spacing is contextual rather than a strict 4px grid. Corners are 3px on rows/view buttons, 4px on search/export, and 5px on the toolbar. Real model geometry with ground shadow, no decorative cards. At 820px and below, mobile puts the canvas (64dvh, minimum 430px) before a two-column inspector in document flow. Only the assembly list becomes a 260px overlay, toggled by Parts.


## Layout and interaction details

Desktop has a 72px header, a 238px / flexible canvas / 276px workspace, and a 33px footer. The workspace has a 620px minimum height; side panels scroll independently. At 1600px and above side columns become 265px and 300px. At 1100px and below they become 205px and 240px, panel padding falls from 22px to 17px, and revision/grid captions hide. Mobile uses a 60px header and a 24px scene heading.

Selection uses a pale olive list row (#e0e7d7, text #304424) and an orange bounding box in the model. Focus-visible outlines are olive, 2px with 4px offset. The toolbar has a faint shadow (0 3px 8px #24292308); the mobile parts overlay uses 8px 10px 30px #24292325. Export hover darkens to #34462a; pending buttons have half opacity and a wait cursor.

Camera presets switch directly; reset restores perspective and collapses explosion. Slider changes directly separate model groups and refit the camera. Orbit uses damping. Propeller animation is opt-in and disabled when reduced motion is requested at load. Selection, camera changes and export status are announced in a polite live region. Export contains the visible assembly.
