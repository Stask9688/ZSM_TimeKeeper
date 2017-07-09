/**
 * Created by Stas on 6/28/2017.
 */
var OnloadProcessing = class {

    static generateEmployeeDetail(timecard_data, project_data) {
        console.log(timecard_data);
        let data_object = timecard_data;
        let projects = project_data;

        let parsed_data = [];
        for (let index = 0; index < data_object.length; index++) {
            data_object[index]["fields"].pk = data_object[index].pk;
            parsed_data.push(data_object[index]["fields"]);
        }

        let timecard_filter = new DataVisualization(parsed_data);
        timecard_filter.generateDimension("timecard_date");

        let tableChart = dc.dataTable("#timecard_table");
        timecard_filter.ndx.groupAll();
        tableChart.order(d3.ascending)
            .dimension(timecard_filter.dimension["timecard_date"])
            .group(function (d) {
                return d.timecard_date;
            }).columns([
            {
                label: "Project Name",
                format: function (d) {
                    return projects[d.timecard_project - 1].fields.project_name;
                }
            },
            {
                label: "Hours Worked",
                format: function (d) {
                    return d.timecard_hours;
                }
            }]);
        let height = $(".col-md-12 > form").height();
        tableChart.render();
        $("#timecard_table").height(height);
        let barChart = dc.barChart("#timecard_graph");
        let hoursGroup = timecard_filter.dimension["timecard_date"].group().reduceSum(
            function (d) {
                return d["timecard_hours"];
            }
        );
        barChart
            .x(d3.scale.ordinal())
            .xUnits(dc.units.ordinal)
            .xAxis().tickFormat(function (d) {
            return d.substr(8)
        });

        barChart
            .brushOn(true)
            .xAxisLabel('Date')
            .yAxisLabel('Hours Worked')
            .dimension(timecard_filter.dimension["timecard_date"])
            .group(hoursGroup);
        barChart.render();

        $(window).resize(function () {
            barChart.resetSvg();
            barChart.render()
        })
    }


    static get_projects(project_data, timecard_data) {
        // Unparse serialized data into json format
        let parsed_data = [];
        let timecard_parsed = [];
        //Move pk value into crossfilterable space, move it to working object "parsed_data"
        for (let index = 0; index < project_data.length; index++) {
            project_data[index]["fields"].pk = project_data[index].pk;
            parsed_data.push(project_data[index]["fields"]);
        }
        for (let index = 0; index < timecard_data.length; index++) {
            timecard_data[index]["fields"].pk = timecard_data[index].pk;
            timecard_parsed.push(timecard_data[index]["fields"]);
        }
        console.log(timecard_parsed);
        console.log(parsed_data);
        // Create crossfilter for project data
        let project_filter = new DataVisualization(parsed_data);

        //Create dimension for which we will group
        // Example: we pick dimension pk (x-axis), for which values will be grouped
        project_filter.generateDimension("pk");

        //Initialize table chart to be rendered on component with id=project_table
        let tableChart = dc.dataTable("#project_table");
        tableChart.order(d3.ascending)
            .dimension(project_filter.dimension["pk"])
            .group(function (d) {
                //Tables don't need groups like other charts,
                //you can filter on a value, but the table looks ugly.
                //Returning empty string instead
                return "";
            })
            //c
            .columns([
                //Create the columns, specifying the table label
                //as well as the value to display
                {
                    label: "ID",
                    format: function (d) {
                        return d.pk;
                    }
                },
                {
                    label: "Project Name",
                    format: function (d) {
                        return d.project_name;
                    }
                }, {
                    label: "Hours spent",
                    format: function (d) {
                        let total = 0;
                        let length = timecard_parsed.length;
                        for (let i = 0; i < length; i++) {
                            if (timecard_parsed[i]['timecard_project'] === d.pk) {
                                console.log(timecard_parsed[i]);
                                total += timecard_parsed[i]['timecard_hours'];
                            }
                        }
                        return total;
                    }
                },
                {
                    label: "Total Charges",
                    format: function (d) {
                        let total = 0;
                        let length = timecard_parsed.length;
                        for (let i = 0; i < length; i++) {
                            if (timecard_parsed[i]['timecard_project'] === d.pk) {
                                console.log(timecard_parsed[i]);
                                total += timecard_parsed[i]['timecard_hours'] * timecard_parsed[i]['timecard_charge'];
                            }
                        }
                        return "$ " + (total).toFixed(2);
                    }
                },
                {
                    label: "Project Description",
                    format: function (d) {
                        return d.project_description;
                    }
                }]);

        //Create a reduce sum group out of the pk dimension.
        //This effectively adds up values for data items which share the same
        //dimension value
        //Example: data object with pk of 1 has project_hours value of 50.
        //         Resulting graph will have x value 1 with a bar of value 50
        let hoursGroup = project_filter.dimension["pk"].group().reduceSum(
            function (d) {
                return d["project_hours"];
            }
        );
        let barChart = dc.barChart(" #bar_chart");
        barChart
            .x(d3.scale.ordinal())
            .xUnits(dc.units.ordinal)
            .brushOn(false)
            .xAxisLabel('Project ID')
            .yAxisLabel('Hours Worked')
            .dimension(project_filter.dimension["pk"])
            .group(hoursGroup);

        //Dcjs tables add a row on render, we'll remove it
        //via jquery
        tableChart.on('postRender', function () {
            $(".dc-table-group").remove()
        });

        tableChart.on('postRedraw', function () {
            console.log("nah")
            $(".dc-table-row>td:first-child").each(function () {
                let detail = $(this).html();
                console.log($(this).text());
                $(this).parent().attr("onclick", "window.location = '/project_detail/" + detail + "'")
            });

            $("td>a").attr("href",);
        });
        tableChart.on('postRender', function () {
            console.log("nah")
            $(".dc-table-row>td:first-child").each(function () {
                let detail = $(this).html();
                console.log($(this).text());
                $(this).parent().attr("onclick", "window.location = '/project_detail/" + detail + "'")
            });

            $("td>a").attr("href",);
        });

        tableChart.render();
        barChart.render();
        $(window).resize(function () {
            barChart.resetSvg();
            barChart.render()
        })


    }

    static processTimecardData(data) {
        console.log(data);


    }

};