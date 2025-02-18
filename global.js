async function loadData() {
    const data = await d3.csv('data/male_medians.csv', d => ({
        minute: +d.time, // Convert string to number
        temperature: +d.median_activity, // Convert string to number
    }));
    
    createLinePlot(data);
}

function createLinePlot(data) {
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Choose a window size for the rolling average
    const windowSize = 100;  // You can adjust this value

    // Calculate the rolling averages
    const smoothedData = calculateRollingAverage(data, windowSize);

    // Create the SVG container for the plot
    const svg = d3.select('#chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Define the scales
    const x = d3.scaleLinear()
        .domain([0, d3.max(smoothedData, d => d.minute)]) // From 0 to 1440 minutes (one day)
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([d3.min(smoothedData, d => d.temperature), d3.max(smoothedData, d => d.temperature)])
        .range([height, 0]);

    // Add X and Y axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(12).tickFormat(d => d % 60 === 0 ? `${d / 60}:00` : ''));

    svg.append('g')
        .call(d3.axisLeft(y));

    // Create the line generator function
    const line = d3.line()
        .x(d => x(d.minute))
        .y(d => y(d.temperature));

    // Add the line for the rolling averages
    svg.append('path')
        .data([smoothedData])
        .attr('class', 'line')
        .attr('d', line)
        .style('stroke', '#ff7f0e')  // You can change the color to distinguish the smoothed line
        .style('stroke-width', 2)
        .style('fill', 'none');

    // Add the original line to compare (optional)
    svg.append('path')
        .data([data])
        .attr('class', 'line')
        .attr('d', line)
        .style('stroke', '#1f77b4')  // Original line
        .style('stroke-width', 1)
        .style('fill', 'none');

    // Add a title for the line
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .text('Median Body Temperature of Male Mice Throughout the Day');
}


function calculateRollingAverage(data, windowSize) {
    const smoothedData = [];

    for (let i = 0; i < data.length; i++) {
        // Get the window of data for the rolling average
        const window = data.slice(Math.max(i - windowSize + 1, 0), i + 1);

        // Calculate the average of the values in the window
        const avg = d3.mean(window, d => d.temperature);
        smoothedData.push({
            minute: data[i].minute,
            temperature: avg
        });
    }

    return smoothedData;
}