# Web39 — complete 2D character drawings

The new first-two-outfit gesture library uses48 complete character drawings per gesture at24FPS (two seconds). Full-character image-generated cels are cropped, uniformly scaled, registered and packed; no body-part articulation, face patches,3D rigs or optical-flow interpolation. Victoria first outfit uses the user-approved opaque beige short-sleeve T-shirt. Where denser sheets fail, two24-cel sheets form the48-drawing sequence with whole-cell assembly only.

Canvas2D targets24drawing updates per second while whole-character travel uses display-refresh updates. Actors walk looking ahead, stop, then turn toward the viewer; each visit has one scene, with complete offscreen exits between visits. Costume visits use costume walking/running/turning assets throughout, so wardrobe changes happen offscreen. Generated walk/run cycles and gestures are actual drawings; numerical frame/alpha/count checks do not prove cinematic naturalness, which remains user acceptance. Upper financial outfits keep their existing simpler approved2D art, as requested.

A bounded six-image cache and readiness guard preserve the beginning of each gesture on slow loading. Hidden tabs/forms, hover/focus and device reduced-motion preferences pause or stop the appropriate animation. Artwork does not modify financial records or make runtime AI requests. Dialogues, reviewed chat actions and role checks retain the existing app behavior.

Earlier research and limitations, retained for context:

# Mascot walk-cycle research and next-test changes

The approved character design stays unchanged. This pass adjusts registration and motion mechanics, without replacing the drawings, cloning the app, or changing financial records.

## Primary animation references

- [Animation Mentor: Jason Martinsen’s human walk-cycle tutorial](https://www.animationmentor.com/blog/tutorial-animating-human-walk-cycle/): contact, down, passing, up, alternating contacts; root translation, linear foot travel during contact, overlap and a controlled stop. The tutorial describes a typical 20–30-frame cycle at 24fps.
- [Toon Boom: walk analysis](https://learn.toonboom.com/modules/walk-cycle-animation2/topic/walk-analysis): alternating planted feet, weight-bearing down position and the rising/push-off position.
- [Toon Boom: drawing and testing a walk cycle](https://learn.toonboom.com/modules/walk-cycle-animation2/topic/about-animating-a-walk-cycle): block the keys, add breakdown/in-between drawings, then test exposure and motion before cleanup.

## Problems identified in our implementation

1. Every drawing was resized independently to the same height. This erased the down/up motion and could change head/body scale between poses.
2. Bounding-box centering let a swinging arm or extended foot push the entire head sideways.
3. Drawing cadence used elapsed time and a minimum FPS, independently of actual root travel. The feet could keep cycling while movement slowed or stopped.
4. Travel began and stopped at constant speed with abrupt velocity changes.
5. The canvas backing store was reset on every frame, unnecessarily resetting drawing state.

## Changes for the next test

- One uniform scale for each full walk cycle, preserving its drawn height changes. Ground contact stays at the same bottom baseline.
- Head registration within a generously padded frame, reducing artwork-position pops without redrawing the approved face.
- Pose phase follows actual distance travelled, at the displayed character scale. Travel finishes at a contact key (0 or4).
- Smooth integrated velocity ramps around a steady middle segment. The browser still paints movement at display refresh.
- The renderer reads the same live distance/phase reference used by screen movement, rather than predicting ahead of React updates.
- Resize the canvas backing store only when source dimensions change.
- Walking image URLs carry a registration version so an existing service worker cannot silently reuse the old resized drawings.
- Preserve both characters, all outfits, menus, dialogue, profile isolation and financial calculations.

## Quality limit

There are still eight drawn key poses per walk. Registration and timing fixes cannot create coherent anatomical in-betweens, repair inconsistent limb drawings, guarantee planted-foot locking, or create a true run from a walking cycle. No frame blending/ghosting is presented as new artwork, and no 24fps cinematic-quality claim is made. Further polish requires cleanup and actual in-between drawings (or a properly prepared 2D character rig) reviewed as animation.

Automated tests check timing, boundaries, contact-key stops, proportional phase, registration and financial regressions. The user reviews naturalness in the existing app; no extra preview is shown.

## 3D motion laboratory (web37)

At the user's request, the earlier geometric 3D model is available again as an explicitly selected movement test. In Aparência do assistente, enable Testar movimentos com modelo 3D. It does not replace the approved illustrated design by default. Test controls play walk, run, six-second fall/get-up, dance, sneeze, wave and stretch, or an automatic in-place playlist. All actions work regardless of financial stage; manual actions return to rest and are separate from financial records. Disable the option to return to the approved illustrated mascot. These are procedural test routines, not finished film choreography.

## Illustrated skin and feature-animation-inspired finish (web38)

The normal character now uses articulated 3D body movement with the exact approved illustrated head artwork mapped to an alpha-contoured, curved portrait surface. Each outfit has normal and skeptical portraits from the existing approved atlases; no face is repainted or wrapped around a sphere. The former placeholder head meshes are detached so they neither render nor affect floor bounds. Expression changes swap the active portrait mesh; detached portrait variants do not inflate bounds. Body skin colour is sampled from the approved portrait, clothing receives a fine fabric map, and lighting/materials use a warmer, softer finish with no hard cel outlines.

This is a 2.5D illustrated-head/3D-body hybrid, not a fully sculpted portrait or film-quality Pixar model. The illustrated face preserves the approved identity but has image-based expressions, not full 3D eyelid/mouth deformation or lip-sync. The requested visual direction is feature-animation-inspired; final appearance approval remains the user's. All original images remain unchanged. The former test-mode option now shows/hides movement controls; the textured hybrid is the normal renderer. Original full-body illustration is the loading/error fallback. A canonical three-second recovery is retimed to the six-second procedural fall rig, while manual six-second tests retain their native timing. No financial records or permissions are changed.

Victoria first-outfit dance shares her complete48-drawing celebration motion after repeated image-generation failures for a separate dance page. Each clip still contains48distinct complete character drawings; no frame duplication/interpolation is used to reach that number. This shared motion is explicit in the manifest and must be disclosed, rather than claimed as a separately authored dance.


## Web41 — registration and conversation
Victoria's six walk/run/turn clips use per-cel whole-image horizontal translation offsets. Head-region opaque warm-color centroids identify sheet drift; integer offsets register it at the frame center. The renderer pads the canvas before drawing so no whole-cel pixels are clipped. No head patches, skeletal articulation or interpolation. Source atlas files are unchanged. Run `node scripts/register-mascot-motion.mjs` after repacking to regenerate registration metadata.
The normal mascot enters from the right, rests in the lower-right corner and stands above the 61px-plus-safe-area phone navigation. Context reactions accompany entry; only the first visit is overridden, preserving the existing spontaneous playlist. Local entry/save observations never write financial data or call AI. Comic conversation uses the same AssistantChat, API, role checks, attachments and review/confirmation flows as before; no new assistant permission. Chat remains in a scrollable bubble beside the stationary mascot; Escape/close ends it. Other dialogs temporarily hide the bubble without unmounting it.


Web42: movement testing panel and appearance checkbox removed from the production companion. Legacy motionTest preferences remain readable for backup compatibility but cannot activate test playback or hide normal speech. Normal autonomous/resting behavior now always applies.
