async function loadData() {
    // Load both the male and female data
    const maleData = await d3.csv('data/male_medians.csv', d => ({
        minute: +d.time, // Convert string to number
        temperature: +d.median_activity, // Convert string to number
    }));

    const femaleData = await d3.csv('data/fem_medians.csv', d => ({
        minute: +d.time, // Convert string to number
        temperature: +d.median_activity, // Convert string to number
    }));

    // Choose a window size for the rolling average
    const windowSize = 10;  // Small window size for testing

    // Calculate the rolling averages for both datasets
    const smoothedMaleData = calculateRollingAverage(maleData, windowSize);
    const smoothedFemaleData = calculateRollingAverage(femaleData, windowSize);

    // Create the line plot with both smoothed data
    createLinePlot(smoothedMaleData, smoothedFemaleData);
}

function createLinePlot(smoothedMaleData, smoothedFemaleData) {
    const margin = { top: 50, right: 30, bottom: 40, left: 40 }; // Increased top margin for title visibility
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Create the SVG container for the plot
    const svg = d3.select('#chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Define the scales
    const x = d3.scaleLinear()
        .domain([0, d3.max(smoothedMaleData, d => d.minute)]) // Use the maximum minute from the male data
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([d3.min([d3.min(smoothedMaleData, d => d.temperature), d3.min(smoothedFemaleData, d => d.temperature)]),
                 d3.max([d3.max(smoothedMaleData, d => d.temperature), d3.max(smoothedFemaleData, d => d.temperature)])])
        .range([height, 0]);

    // Add X and Y axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(12).tickFormat(d => d % 60 === 0 ? `${d / 60}:00` : '')); // Display hour ticks

    svg.append('g')
        .call(d3.axisLeft(y));

    // Add horizontal gridlines
    const gridlines = svg.append('g')
        .attr('class', 'gridlines');

    gridlines.call(
        d3.axisLeft(y)
        .tickSize(-width)  // Make ticks as long as the width of the chart to create horizontal lines
        .tickFormat('')    // Remove tick labels for the gridlines
    )
    .selectAll('line')    // Select all gridline elements
    .style('stroke', '#ccc')  // Light gray color
    .style('stroke-opacity', 0.8);

    // Create the line generator function
    const line = d3.line()
        .x(d => x(d.minute))
        .y(d => y(d.temperature));

    // Add the smoothed male line to the plot
    svg.append('path')
        .data([smoothedMaleData])
        .attr('class', 'line')
        .attr('d', line)
        .style('stroke', '#1f77b4')  // Male data line (blue)
        .style('stroke-width', 2)
        .style('fill', 'none');

    // Add the smoothed female line to the plot
    svg.append('path')
        .data([smoothedFemaleData])
        .attr('class', 'line')
        .attr('d', line)
        .style('stroke', '#ff7f0e')  // Female data line (orange)
        .style('stroke-width', 2)
        .style('fill', 'none');

    // Add a title for the plot
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -margin.top / 2)  // Adjusted y-position for visibility
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .text('Median Body Temperature of Male and Female Mice Throughout the Day');

    // Add a legend
    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width - 150}, 20)`);  // Position the legend to the right of the plot

    // Male Legend
    legend.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 20)
        .attr('height', 20)
        .style('fill', '#1f77b4');  // Blue for male data

    legend.append('text')
        .attr('x', 25)
        .attr('y', 15)
        .style('font-size', '12px')
        .style('fill', '#1f77b4')  // Same blue color for the text
        .text('Male');

    // Female Legend
    legend.append('rect')
        .attr('x', 0)
        .attr('y', 30)
        .attr('width', 20)
        .attr('height', 20)
        .style('fill', '#ff7f0e');  // Orange for female data

    legend.append('text')
        .attr('x', 25)
        .attr('y', 45)
        .style('font-size', '12px')
        .style('fill', '#ff7f0e')  // Same orange color for the text
        .text('Female');
}


document.addEventListener('DOMContentLoaded', () => {
    loadData();
});

function calculateRollingAverage(data, windowSize) {
    const smoothedData = [];

    for (let i = 0; i < data.length; i++) {
        const window = data.slice(Math.max(i - windowSize + 1, 0), i + 1);
        const avg = d3.mean(window, d => d.temperature);
        smoothedData.push({
            minute: data[i].minute,
            temperature: avg
        });
    }

    return smoothedData;
}
