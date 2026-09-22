import type { Lesson } from '../schema';
import { LessonSchema } from '../schema';

/** Built-in lesson `sample-counter` — preserved exact id (lesson-id contract). */
export const lesson: Lesson = LessonSchema.parse({
  "id": "sample-counter",
  "title": "Sample \u00b7 Build a click counter (HTML/CSS/JS)",
  "kind": "web",
  "files": [
    {
      "name": "index.html",
      "text": "<!doctype html>\n<html>\n<head>\n  <meta charset=\"utf-8\">\n  <title>Counter</title>\n</head>\n<body>\n\n</body>\n</html>\n"
    },
    {
      "name": "style.css",
      "text": "body {\n  font-family: system-ui, sans-serif;\n  display: grid;\n  place-items: center;\n  min-height: 90vh;\n  margin: 0;\n}\n"
    },
    {
      "name": "script.js",
      "text": ""
    }
  ],
  "ops": [
    {
      "t": 600,
      "chapter": "Markup"
    },
    {
      "t": 600,
      "say": "Let's build a tiny click counter. First the markup: a value and a button."
    },
    {
      "t": 5385,
      "c": 95
    },
    {
      "t": 5685,
      "f": 0,
      "p": 95,
      "d": 0,
      "i": "  <main class=\"counter\">\n"
    },
    {
      "t": 6375,
      "f": 0,
      "p": 120,
      "d": 0,
      "i": "    <p class=\"value\" id=\"value\">0</p>\n"
    },
    {
      "t": 7351,
      "f": 0,
      "p": 158,
      "d": 0,
      "i": "    <button id=\"inc\">Count up</button>\n"
    },
    {
      "t": 8349,
      "f": 0,
      "p": 197,
      "d": 0,
      "i": "  </main>\n"
    },
    {
      "t": 8709,
      "chapter": "Style"
    },
    {
      "t": 8709,
      "say": "Now some styling so it looks like a card."
    },
    {
      "t": 12054,
      "tab": 1
    },
    {
      "t": 12554,
      "c": 120
    },
    {
      "t": 12854,
      "f": 1,
      "p": 120,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 13016,
      "f": 1,
      "p": 121,
      "d": 0,
      "i": ".counter {\n"
    },
    {
      "t": 13398,
      "f": 1,
      "p": 132,
      "d": 0,
      "i": "  text-align: center;\n"
    },
    {
      "t": 14022,
      "f": 1,
      "p": 154,
      "d": 0,
      "i": "  padding: 32px 48px;\n"
    },
    {
      "t": 14646,
      "f": 1,
      "p": 176,
      "d": 0,
      "i": "  border-radius: 16px;\n"
    },
    {
      "t": 15292,
      "f": 1,
      "p": 199,
      "d": 0,
      "i": "  background: #f3efe6;\n"
    },
    {
      "t": 15938,
      "f": 1,
      "p": 222,
      "d": 0,
      "i": "}\n"
    },
    {
      "t": 16122,
      "f": 1,
      "p": 224,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 16284,
      "f": 1,
      "p": 225,
      "d": 0,
      "i": ".value {\n"
    },
    {
      "t": 16622,
      "f": 1,
      "p": 234,
      "d": 0,
      "i": "  font-size: 72px;\n"
    },
    {
      "t": 17180,
      "f": 1,
      "p": 253,
      "d": 0,
      "i": "  margin: 0 0 16px;\n"
    },
    {
      "t": 17760,
      "f": 1,
      "p": 273,
      "d": 0,
      "i": "  font-variant-numeric: tabular-nums;\n"
    },
    {
      "t": 18736,
      "f": 1,
      "p": 311,
      "d": 0,
      "i": "}\n"
    },
    {
      "t": 18920,
      "f": 1,
      "p": 313,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 19082,
      "f": 1,
      "p": 314,
      "d": 0,
      "i": "button {\n"
    },
    {
      "t": 19420,
      "f": 1,
      "p": 323,
      "d": 0,
      "i": "  font: inherit;\n"
    },
    {
      "t": 19934,
      "f": 1,
      "p": 340,
      "d": 0,
      "i": "  padding: 10px 22px;\n"
    },
    {
      "t": 20558,
      "f": 1,
      "p": 362,
      "d": 0,
      "i": "  border-radius: 999px;\n"
    },
    {
      "t": 21226,
      "f": 1,
      "p": 386,
      "d": 0,
      "i": "  border: 0;\n"
    },
    {
      "t": 21652,
      "f": 1,
      "p": 399,
      "d": 0,
      "i": "  background: #c2410c;\n"
    },
    {
      "t": 22298,
      "f": 1,
      "p": 422,
      "d": 0,
      "i": "  color: white;\n"
    },
    {
      "t": 22790,
      "f": 1,
      "p": 438,
      "d": 0,
      "i": "  cursor: pointer;\n"
    },
    {
      "t": 23348,
      "f": 1,
      "p": 457,
      "d": 0,
      "i": "}\n"
    },
    {
      "t": 23532,
      "chapter": "Behaviour"
    },
    {
      "t": 23532,
      "say": "And the behaviour: one listener that increments and writes the number back."
    },
    {
      "t": 28407,
      "tab": 2
    },
    {
      "t": 28907,
      "f": 2,
      "p": 0,
      "d": 0,
      "i": "const value = document.getElementById('value');\n"
    },
    {
      "t": 30103,
      "f": 2,
      "p": 48,
      "d": 0,
      "i": "const button = document.getElementById('inc');\n"
    },
    {
      "t": 31277,
      "f": 2,
      "p": 95,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 31439,
      "f": 2,
      "p": 96,
      "d": 0,
      "i": "let count = 0;\n"
    },
    {
      "t": 31909,
      "f": 2,
      "p": 111,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 32071,
      "f": 2,
      "p": 112,
      "d": 0,
      "i": "button.addEventListener('click', () => {\n"
    },
    {
      "t": 33113,
      "f": 2,
      "p": 153,
      "d": 0,
      "i": "  count += 1;\n"
    },
    {
      "t": 33561,
      "f": 2,
      "p": 167,
      "d": 0,
      "i": "  value.textContent = count;\n"
    },
    {
      "t": 34339,
      "f": 2,
      "p": 196,
      "d": 0,
      "i": "});\n"
    },
    {
      "t": 34567,
      "stop": {
        "title": "Your turn",
        "q": "Pause here and try it: make the button decrement instead. What single character changes?",
        "explain": "Only the operator: `count += 1` becomes `count -= 1`. The DOM wiring stays the same."
      }
    },
    {
      "t": 34767,
      "say": "Try clicking the button in the preview. Pause any time and change the code yourself."
    }
  ],
  "duration": 39267,
  "audio": null,
  "builtin": true
});
export default lesson;
