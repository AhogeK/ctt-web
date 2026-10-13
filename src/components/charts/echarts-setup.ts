import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, CustomChart, HeatmapChart, LineChart, ScatterChart } from 'echarts/charts'
import {
  CalendarComponent,
  GraphicComponent,
  GridComponent,
  MarkLineComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components'

// Register only what the dashboard charts need — ECharts full bundle is
// ~300KB+ gzip and the budget allows tree-shaken imports only (see plan D4).
// CustomChart + GridComponent: the heatmap draws cells via a custom series on
// explicit value axes (roundRect cells, engine ignores heatmap borderRadius).
// LineChart: the 30-day trend panel (smooth line + gradient area) and the
// long-term trend panel's average line.
// ScatterChart: the long-term trend panel's daily dots (hidden at phone widths).
// MarkLineComponent: the long-term trend panel's dashed window-mean level —
//   without this registration `series.markLine` is silently dropped, option
//   object or not (the unit tests cannot see a canvas).
// GraphicComponent: the trend panel's hand-drawn gradient grid lines.
// BarChart: the average-hourly panel (24 indigo gradient bars).
use([
  CanvasRenderer,
  HeatmapChart,
  CustomChart,
  GridComponent,
  CalendarComponent,
  TooltipComponent,
  VisualMapComponent,
  LineChart,
  ScatterChart,
  MarkLineComponent,
  GraphicComponent,
  BarChart,
])
