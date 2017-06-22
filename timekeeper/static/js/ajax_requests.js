/**
 * Created by Stas on 6/6/2017.
 */
    //Example of an ajax query to get data from the database
    //the get request is sent to url /project_data, which in turn gets sent
    // to the callback listed in the views.
    // The callback in the views queries the database, gets the object with the
    // project_name "Test project", and returns the request.
    // Then, using Jquery, selects the elements with ids "test_name" and "test_description"
    // and changes their text to the value of the data sent back.

class AjaxRequest {
    static get_data_for_project_detail(pk) {
        $.get("/project_detail_dcjs/" + pk).done(function (data) {

            let timecard_data = JSON.parse(data.timecards);
            let client_data = JSON.parse(data.client);
            var user_data = JSON.parse(data.users);
            let project_data = JSON.parse(data.project);

            // for(let i =0;i<timecard_data.length;i++ ){
            //     timecard_data[i].fields.timecard_owner = user_data[timecard_data[i].fields.timecard_owner];
            // }
            console.log(timecard_data);
            let master_timecard = []
            for (let i = 0; i < timecard_data.length; i++) {
                master_timecard[i] = timecard_data[i].fields;
                master_timecard[i].pk = timecard_data[i].pk;
            }
            console.log(master_timecard)
            // Create crossfilter for project data
            let project_filter = new DataVisualization(master_timecard);

            //Create dimension for which we will group
            // Example: we pick dimension pk (x-axis), for which values will be grouped
            project_filter.generateDimension("timecard_date");
            project_filter.generateDimension("timecard_owner");

            let custom_dimension = project_filter.ndx.dimension(function (d) {
                return user_data[d.timecard_owner - 1].fields.first_name;
            });


            let tableChart = dc.dataTable("#project_employee_detail");
            tableChart.order(d3.ascending)
                .dimension(project_filter.dimension["timecard_date"])
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
                        label: "Employee",
                        format: function (d) {
                            console.log(d);
                            return user_data[d.timecard_owner - 1].fields.first_name + " " +
                                user_data[d.timecard_owner - 1].fields.last_name;
                        }
                    },
                    {
                        label: "Date Worked",
                        format: function (d) {
                            return d.timecard_date;
                        }
                    },
                    {
                        label: "Hours Worked",
                        format: function (d) {
                            return d.timecard_hours;
                        }
                    },
                    {
                        label: "Day Charge",
                        format: function (d) {
                            return d.timecard_charge * d.timecard_hours;
                        }
                    }
                ]);
            tableChart.render();

            let hoursWorked = dc.barChart("#project_progress_chart");
            let hoursWorkedPerDay = project_filter.dimension["timecard_date"].group().reduceSum(
                function (d) {
                    return d.timecard_hours;
                }
            );
            hoursWorked
                .x(d3.scale.ordinal())
                .xUnits(dc.units.ordinal)
                .xAxis().tickFormat(function (d) {
                return d.substr(8)
            });

            hoursWorked
                .brushOn(true)
                .xAxisLabel('Date')
                .yAxisLabel('Hours Worked')
                .dimension(project_filter.dimension["timecard_date"])
                .group(hoursWorkedPerDay);
            hoursWorked.render();

            let hoursPerPerson = dc.pieChart("#perPersonHours");
            let hoursPerPersonGroup = custom_dimension.group().reduceSum(
                function (d) {
                    return d.timecard_charge;
                }
            );
            hoursPerPerson

                .dimension(custom_dimension)
                .group(hoursPerPersonGroup)
                .legend(dc.legend());

            hoursPerPerson.render();

            let timecardHoursGroup = project_filter.ndx.groupAll().reduce(
                function (p, v) {
                    ++p.n;
                    p.tot += v.timecard_hours ;
                    return p;
                },
                function (p, v) {
                    --p.n;
                    p.tot -= v.timecard_hours;
                    return p;
                },
                function () {
                    return {n: 0, tot: 0};
                }
            );
            let total = function (d) {

                console.log(d)

                return d.tot;
            };
let totalHoursWorked = dc.numberDisplay("#total_hours");
            totalHoursWorked.group(timecardHoursGroup).dimension(project_filter.dimension["timecard_date"]).valueAccessor(total);
            totalHoursWorked.render();

            let timecardChargeGroup = project_filter.ndx.groupAll().reduce(
                function (p, v) {
                    ++p.n;
                    p.tot += v.timecard_charge *v.timecard_hours;
                    return p;
                },
                function (p, v) {
                    --p.n;
                    p.tot -= v.timecard_charge *v.timecard_hours;
                    return p;
                },
                function () {
                    return {n: 0, tot: 0};
                }
            );
            let chargesTotal = dc.numberDisplay("#total_charges");
            chargesTotal.group(timecardChargeGroup).dimension(project_filter.dimension["timecard_date"]).valueAccessor(total);
            chargesTotal.render();

        })
    }

    static get_projects_by_client(pk) {
        $.get("/project_from_client/" + pk).done(function (data) {


        })
    }

    static get_projects() {
        $.get("/project_data").done(function (data) {
            // Unparse serialized data into json format
            let data_object = JSON.parse(data);
            let parsed_data = [];

            //Move pk value into crossfilterable space, move it to working object "parsed_data"
            for (let index = 0; index < data_object.length; index++) {
                data_object[index]["fields"].pk = data_object[index].pk;
                parsed_data.push(data_object[index]["fields"]);
            }

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
                            return d.project_hours;
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

        });

    }

    static get_timecard() {
        $.get("/timecard_data").done(function (data) {
            let data_object = JSON.parse(data.timecard);
            let projects = JSON.parse(data.project)

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
        });
    }

    static get_clients() {
        $.get("/client_data").done(function (data) {
            let data_object = JSON.parse(data.timecard);
            let projects = JSON.parse(data.project)

            let parsed_data = [];
            for (let index = 0; index < data_object.length; index++) {
                data_object[index]["fields"].pk = data_object[index].pk;
                parsed_data.push(data_object[index]["fields"]);
            }
        });
    }

    static generateBarGraph(data) {
        console.log(data)
    }
}

