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
