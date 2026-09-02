import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { CustomChart, HeatmapChart } from 'echarts/charts'
import { CalendarComponent, GridComponent, TooltipComponent, VisualMapComponent } from 'echarts/components'

// Register only what the dashboard charts need — ECharts full bundle is
// ~300KB+ gzip and the budget allows tree-shaken imports only (see plan D4).
// CustomChart + GridComponent: the heatmap draws cells via a custom series on
// explicit value axes (roundRect cells, engine ignores heatmap borderRadius).
use([CanvasRenderer, HeatmapChart, CustomChart, GridComponent, CalendarComponent, TooltipComponent, VisualMapComponent])
