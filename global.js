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
    const margin = { top: 50, right: 200, bottom: 70, left: 80 };
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
    const x = d3.scaleLinear().domain([0, 1440]).range([0, width]);
    const y = d3.scaleLinear()
        .domain([
            d3.min([d3.min(smoothedMaleData, d => d.temperature), d3.min(smoothedFemaleData, d => d.temperature)]),
            60
        ])
        .range([height, 0]);

    // Add axes and gridlines
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickValues(d3.range(0, 1441, 120)).tickFormat(d => `${Math.floor(d / 60)}:00`));

    svg.append('g').call(d3.axisLeft(y));
    
    svg.append('g').attr('class', 'gridlines').call(d3.axisLeft(y).tickSize(-width).tickFormat('').ticks(10))
        .selectAll('line').style('stroke', '#ccc').style('stroke-opacity', 0.8);

    // Create the lines for male and female activity data
    const line = d3.line().x(d => x(d.minute)).y(d => y(d.temperature));

    const maleLine = svg.append('path').data([smoothedMaleData]).attr('class', 'line').attr('d', line)
        .style('stroke', '#1f77b4').style('stroke-width', 2.5).style('fill', 'none');

    const femaleLine = svg.append('path').data([smoothedFemaleData]).attr('class', 'line').attr('d', line)
        .style('stroke', '#ff7f0e').style('stroke-width', 2.5).style('fill', 'none');

    // Add chart titles and vertical line
    svg.append('text').attr('x', width / 2).attr('y', -margin.top / 2).attr('text-anchor', 'middle').style('font-size', '18px')
        .text('Median Activity of Male and Female Mice Throughout the Day');
    svg.append('text').attr('x', width / 2).attr('y', height + 40).attr('text-anchor', 'middle').style('font-size', '14px')
        .text('Time of Day (hours)');
    svg.append('text').attr('transform', 'rotate(-90)').attr('y', -margin.left + 20).attr('x', -height / 2).attr('text-anchor', 'middle')
        .style('font-size', '14px').text('Median Activity Level');
    svg.append('line').attr('x1', x(720)).attr('x2', x(720)).attr('y1', 0).attr('y2', height).attr('stroke', 'black')
        .attr('stroke-width', 2).attr('stroke-dasharray', '5,5');

    // Create the legend container (inside the body element)
    const legendContainer = d3.select('body').append('div').attr('class', 'legend')
        .style('position', 'absolute')
        .style('top', `${margin.top + 150}px`)
        .style('left', `${width + margin.left + 85}px`); // Responsive position for the legend

    // Male Legend Item
    legendContainer.append('div').attr('class', 'legend-item')
        .html(`<span class="swatch" style="background-color: #1f77b4;"></span> Male Activity`);

    // Female Legend Item
    legendContainer.append('div').attr('class', 'legend-item')
        .html(`<span class="swatch" style="background-color: #ff7f0e;"></span> Female Activity`);

    // Add the dropdown **inside the legend** container
    const dropdown = legendContainer.append('select').attr('id', 'legend-dropdown');

    // Dropdown options
    dropdown.append('option').text('Both').attr('value', 'both');
    dropdown.append('option').text('Male Activity Only').attr('value', 'male');
    dropdown.append('option').text('Female Activity Only').attr('value', 'female');

    // Dropdown onChange functionality
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
