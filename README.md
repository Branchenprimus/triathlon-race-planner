# 🏊‍♂️🚴‍♂️🏃‍♂️ Triathlon Race Planner

Interactive Vue 3 application for planning triathlon race splits with dynamic time distribution.

## Features

- **Distance Presets**: Sprint, Olympic, Half-Ironman, and Ironman distances
- **Interactive Sliders**: Adjust any discipline time with real-time updates
- **Proportional Redistribution**: When one discipline changes, others adjust automatically to maintain target time
- **Pace Calculations**: Real-time pace/speed for swim, bike, and run
- **Visual Feedback**: Color-coded disciplines with percentage breakdowns
- **Responsive Design**: Works on desktop and mobile devices

## Distance Presets

### Sprint
- **Distances**: 750m swim, 20km bike, 5km run
- **Target Time**: 1:30:00
- **Distribution**: Swim 20%, T1 3%, Bike 45%, T2 2%, Run 30%

### Olympic
- **Distances**: 1.5km swim, 40km bike, 10km run
- **Target Time**: 3:00:00
- **Distribution**: Swim 18%, T1 2%, Bike 50%, T2 2%, Run 28%

### Half-Ironman (70.3)
- **Distances**: 1.9km swim, 90km bike, 21.1km run
- **Target Time**: 6:00:00
- **Distribution**: Swim 15%, T1 2%, Bike 52%, T2 2%, Run 29%

### Ironman (140.6)
- **Distances**: 3.8km swim, 180km bike, 42.2km run
- **Target Time**: 12:00:00
- **Distribution**: Swim 13%, T1 2%, Bike 53%, T2 2%, Run 30%

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

1. **Select a Distance Preset** or use Custom mode
2. **Set Target Time** in HH:MM:SS format
3. **Lock/Unlock Disciplines** - Use toggle switches to lock times you want to keep fixed
   - 🏊‍♂️ Schwimmen (Swimming) - unlocked by default
   - 🔄 Wechselzone 1 (Transition 1) - **locked by default**
   - 🚴‍♂️ Radfahren (Cycling) - unlocked by default
   - 🔄 Wechselzone 2 (Transition 2) - **locked by default**
   - 🏃‍♂️ Laufen (Running) - unlocked by default
4. **Adjust Sliders** - Move any unlocked slider
5. **Watch Times Update** - Only unlocked disciplines adjust proportionally

## How It Works

### Lock/Unlock Toggle Feature

Each discipline has a toggle switch to lock/unlock its time:
- **Locked** (🔒): Time stays fixed, won't change when other sliders move
- **Unlocked** (🔓): Time adjusts proportionally when other sliders change

**Default State**: T1 and T2 are locked by default (transitions are typically fixed), while swim, bike, and run are unlocked.

### Proportional Redistribution Algorithm

When you adjust a discipline slider:

1. Calculate the time difference (delta) from the previous value
2. Identify all UNLOCKED disciplines (excluding the one being changed)
3. Redistribute the delta proportionally based on each unlocked discipline's current percentage
4. Locked disciplines remain unchanged
5. Ensure the sum always equals the target time

**Example 1** - Default locks (T1, T2 locked):
- Increase swimming by 5 minutes → bike and run share -5 minutes proportionally
- T1 and T2 stay fixed

**Example 2** - Lock swimming time:
- Toggle swim to "Locked"
- Adjust bike → only run and transitions adjust (if unlocked)
- Swimming stays at its locked value

**Example 3** - Lock everything except one:
- Lock swim, bike, T1, T2
- Only run can adjust to maintain target time
- Useful for planning around a specific run goal

### Time Calculations

- **Swim Pace**: Minutes per 100 meters
- **Bike Speed**: Kilometers per hour
- **Run Pace**: Minutes per kilometer

## Project Structure

```
triathlon-race-planner/
├── src/
│   ├── components/
│   │   └── DisciplineSlider.vue    # Slider component for each discipline
│   ├── composables/
│   │   └── useTriathlonPresets.js  # Preset configurations
│   ├── utils/
│   │   └── timeUtils.js            # Time conversion utilities
│   ├── App.vue                     # Main application component
│   ├── main.js                     # Application entry point
│   └── style.css                   # Global styles
├── index.html
├── package.json
└── vite.config.js
```

## Technologies

- **Vue 3** - Composition API
- **Vite** - Build tool and dev server
- **Native HTML5** - Range inputs for sliders
- **CSS3** - Gradients, flexbox, grid

## Browser Support

Modern browsers with ES6+ support:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT
