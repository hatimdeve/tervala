import React from 'react';
import { ResponsiveBar } from '@nivo/bar'; // Importer le composant Nivo pour les graphiques à barres
import { ResponsiveLine } from '@nivo/line';

const ChartRenderer = ({
  data,
  chartType,
  indexBy,
  keys,
}: {
  data: any;
  chartType: string;
  indexBy: string | null;
  keys: string[];
}) => {
  if (chartType === 'bar') {
    return (
      <div style={{ height: '400px' }}>
        <ResponsiveBar
          data={data}
          keys={keys}
          indexBy={indexBy || ''}
          margin={{ top: 40, right: 130, bottom: 50, left: 60 }}
          padding={0.3}
          colors={{ scheme: 'category10' }}
          borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: indexBy || '',
            legendPosition: 'middle',
            legendOffset: 32,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Value',
            legendPosition: 'middle',
            legendOffset: -40,
          }}
          enableLabel={true}
          animate={true}
          theme={{
            text: { fill: '#ffffff' },
            axis: {
              domain: { line: { stroke: '#777777' } },
              ticks: {
                line: { stroke: '#777777' },
                text: { fill: '#ffffff' },
              },
            },
            legends: {
              text: { fill: '#ffffff' },
            },
          }}
        />
      </div>
    );
  }

  if (chartType === 'line') {
    return (
      <div style={{ height: '400px' }}>
        <ResponsiveLine
          data={data}
          margin={{ top: 40, right: 130, bottom: 50, left: 60 }}
          xScale={{ type: 'point' }}
          yScale={{
            type: 'linear',
            min: 'auto',
            max: 'auto',
            stacked: false,
            reverse: false
          }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: indexBy || '',
            legendOffset: 36,
            legendPosition: 'middle'
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Value',
            legendOffset: -40,
            legendPosition: 'middle'
          }}
          pointSize={10}
          pointColor={{ theme: 'background' }}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          pointLabelYOffset={-12}
          useMesh={true}
          legends={[
            {
              anchor: 'bottom-right',
              direction: 'column',
              justify: false,
              translateX: 100,
              translateY: 0,
              itemsSpacing: 0,
              itemDirection: 'left-to-right',
              itemWidth: 80,
              itemHeight: 20,
              itemOpacity: 0.75,
              symbolSize: 12,
              symbolShape: 'circle',
              symbolBorderColor: 'rgba(0, 0, 0, .5)',
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemBackground: 'rgba(0, 0, 0, .03)',
                    itemOpacity: 1
                  }
                }
              ]
            }
          ]}
          theme={{
            text: { fill: '#ffffff' },
            axis: {
              domain: { line: { stroke: '#777777' } },
              ticks: {
                line: { stroke: '#777777' },
                text: { fill: '#ffffff' },
              },
            },
            legends: {
              text: { fill: '#ffffff' },
            },
          }}
        />
      </div>
    );
  }

  return <div>Type de graphique non supporté</div>;
};

export default ChartRenderer;