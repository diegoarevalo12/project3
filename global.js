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
    const margin = { top: 50, right: 200, bottom: 70, left: 80 }; // Adjusted margins for axis labels
    const width = 1200 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    // Remove existing chart if any (for re-renders)
    d3.select('#chart').selectAll('*').remove();

    // Create the SVG container for the plot
    const svg = d3.select('#chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Define the scales
    const x = d3.scaleLinear()
        .domain([0, 1440])  // 1440 minutes in a day (24 hours × 60 minutes)
        .range([0, width]);

    // Set the y-scale with a hard upper limit at 60
    const y = d3.scaleLinear()
        .domain([ 
            d3.min([d3.min(smoothedMaleData, d => d.temperature), d3.min(smoothedFemaleData, d => d.temperature)]),
            60
        ])
        .range([height, 0]);

    // Add X and Y axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .tickValues(d3.range(0, 1441, 120))  // Tick every 120 minutes (2 hours)
            .tickFormat(d => {
                const hours = Math.floor(d / 60);
                return `${hours}:00`;
            })
        );

    svg.append('g')
        .call(d3.axisLeft(y));

    // Add horizontal gridlines
    const gridlines = svg.append('g')
        .attr('class', 'gridlines');

    gridlines.call(
        d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat('')
        .ticks(10)
    )
    .selectAll('line')
    .style('stroke', '#ccc')
    .style('stroke-opacity', 0.8);

    // Create the line generator function
    const line = d3.line()
        .x(d => x(d.minute))
        .y(d => y(d.temperature));

    // Add the smoothed male line to the plot
    const maleLine = svg.append('path')
        .data([smoothedMaleData])
        .attr('class', 'line')
        .attr('d', line)
        .style('stroke', '#1f77b4')  // Male data line (blue)
        .style('stroke-width', 2.5)
        .style('fill', 'none');

    // Add the smoothed female line to the plot
    const femaleLine = svg.append('path')
        .data([smoothedFemaleData])
        .attr('class', 'line')
        .attr('d', line)
        .style('stroke', '#ff7f0e')  // Female data line (orange)
        .style('stroke-width', 2.5)
        .style('fill', 'none');

    // Add a title for the plot
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -margin.top / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '18px')
        .text('Median Activity of Male and Female Mice Throughout the Day');

    // Add X-axis title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .text('Time of Day (hours)');

    // Add Y-axis title
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin.left + 20)
        .attr('x', -height / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .text('Median Activity Level');

    // Add vertical line at 12:00 (720 minutes)
    svg.append('line')
        .attr('x1', x(720))
        .attr('x2', x(720))
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', 'black')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');  // Dotted line

    // Add labels for Darkness and Lights On
    svg.append('text')
        .attr('x', x(360))  // Position for Darkness label (before 12:00)
        .attr('y', -10)     // Position above the graph
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Darkness (Lights Off)');

    svg.append('text')
        .attr('x', x(1080))  // Position for Lights On label (after 12:00)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Lights On');

    // Create a legend container (HTML) outside the SVG
    const legendContainer = d3.select('body').append('div')
        .attr('class', 'legend')
        .style('position', 'absolute')
        .style('top', `${margin.top + 150}px`)
        .style('left', `${width + margin.left + 100}px`)
        .style('font-family', 'Arial, sans-serif')
        .style('font-size', '14px');

    // Male Legend
    legendContainer.append('div')
        .attr('class', 'legend-item')
        .html(`<span class="swatch" style="background-color: #1f77b4;"></span> Male Activity`);

    // Female Legend
    legendContainer.append('div')
        .attr('class', 'legend-item')
        .html(`<span class="swatch" style="background-color: #ff7f0e;"></span> Female Activity`);

    // Create the dropdown menu to control line visibility
    const dropdown = d3.select('body').append('select')
        .attr('id', 'legend-dropdown')
        .style('position', 'absolute')
        .style('top', `${margin.top + 20}px`)
        .style('left', `${width + margin.left + 100}px`)
        .style('font-size', '14px')
        .style('padding', '5px')
        .style('border-radius', '4px');

    dropdown.append('option').text('Both').attr('value', 'both');
    dropdown.append('option').text('Male Activity Only').attr('value', 'male');
    dropdown.append('option').text('Female Activity Only').attr('value', 'female');

    dropdown.on('change', function() {
        const selectedValue = this.value;

        if (selectedValue === 'male') {
            maleLine.style('display', 'inline');
            femaleLine.style('display', 'none');
        } else if (selectedValue === 'female') {
            maleLine.style('display', 'none');
            femaleLine.style('display', 'inline');
        } else {
            maleLine.style('display', 'inline');
            femaleLine.style('display', 'inline');
        }
    });
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
