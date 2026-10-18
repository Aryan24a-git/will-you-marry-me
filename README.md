# Interactive Birthday Gift

An interactive birthday love story built as a small Vite site. It combines a canvas animation, GSAP transitions, a proposal flow, a 3D memory gallery, a love-letter reveal, and a soundtrack that follows the story.

## Story Flow

1. **Acts 1-4: The opening film**
   - Draw and release Cupid's bow.
   - Watch the heart burst into the rose transition.
   - See the cinematic wish and the heart-shaped blossom tree.
2. **Act 5: The proposal chamber**
   - Answer the proposal.
   - The No button playfully dodges; repeated attempts reveal the pleading GIF.
   - A Yes response unlocks the memory gallery.
3. **Act 6: Memory lane**
   - Browse the interactive 3D photo carousel.
4. **Act 7: The love letter**
   - Open the sealed letter.
   - Read the typewritten promise and choose a vow.

## Soundtrack

The audio controller uses the files in `public/audio/`:

- `part 1.mp3`: Acts 1-4
- `part 2.mp3`: Act 5, after **Step Into Our Next Chapter**
- `part 3.mp3`: Act 6, after **Walk Down Our Memory Lane**
- `part 4.mp3`: Act 7, after **Open The Love Letter**

The site attempts to start the first track on load. Browsers that block audible autoplay retry playback after the first user interaction.

## GIF Moments

The GIFs in `public/gif/` are used as story moments rather than background decoration:

- `cute.gif`: Act 5 celebration after Yes
- `please.gif`: proposal plea artwork
- `tears.gif`: escalated response after repeated No attempts
- `msg.gif`: floating sealed-message cue in Act 7

## Run Locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Build

```bash
npm run build
npm run preview
```

The GitHub Pages workflow builds the Vite output and deploys `dist/` on pushes to `main`.

## Project Files

- `index.html`: story markup and accessible controls
- `birthday.js`: animation, navigation, audio, gallery, letter, and celebration logic
- `birthday.css`: visual design and responsive layout
- `public/audio/`: soundtrack files
- `public/gif/`: animated story assets
- `public/images/`: memory gallery images
