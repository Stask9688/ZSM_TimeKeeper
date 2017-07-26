/**
 * Created by Stas on 6/28/2017.
 */
var OnloadProcessing = class {

    static generateEmployeeDetail(timecard_data, project_data, task_data, profile_data) {
        console.log(project_data);
        console.log(timecard_data);
        console.log(task_data);
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
                    console.log(d);
                    return projects[d.timecard_project - 1].fields.project_name;
                }
            },
            {
                label: "Task Name",
                format: function (d) {
                    console.log(d);
                    console.log(task_data[d.project_task - 1]);
                    return task_data[d.project_task - 1].fields.project_task_title;
                }
            },
            {
                label: "Hours Worked",
                format: function (d) {
                    return d.timecard_hours;
                }
            },
            {
                label: "Labor Cost",
                format: function (d) {
                    return "$ " + (profile_data[0].fields.hourly * d.timecard_hours).toFixed(2);
                }
            }]);
        let height = $(window).height();

        tableChart.render();
        $("#timecard_table").height(height - 200);
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
            return d.substr(6).replace("-", "/")
        });

        barChart
            .brushOn(true)
            .xAxisLabel('Date')
            .yAxisLabel('Hours Worked')
            .dimension(timecard_filter.dimension["timecard_date"])
            .group(hoursGroup);
        barChart.render();

        let total = function (d) {
            return d.tot;
        };
        let timecardChargeGroup = timecard_filter.ndx.groupAll().reduce(
            function (p, v) {
                ++p.n;
                p.tot += v.timecard_hours * profile_data[0].fields.hourly;
                return p;
            },
            function (p, v) {
                --p.n;
                p.tot -= v.timecard_hours * profile_data[0].fields.hourly;
                return p;
            },
            function () {
                return {n: 0, tot: 0};
            }
        );
        let chargesTotal = dc.numberDisplay("#total_labor_cost_display");
        chargesTotal.group(timecardChargeGroup).dimension(timecard_filter.dimension["timecard_date"]).valueAccessor(total);
        chargesTotal.formatNumber(d3.format(''))
        chargesTotal.render();
        console.log(project_data);
        let custom_dimension = timecard_filter.ndx.dimension(function (d) {
            return project_data[d.timecard_project - 1].fields.project_name;
        });
        let hoursPerPerson = dc.pieChart("#projects_worked");
        let hoursPerPersonGroup = custom_dimension.group().reduceSum(
            function (d) {
                return d.timecard_hours;
            }
        );
        hoursPerPerson

            .dimension(custom_dimension)
            .group(hoursPerPersonGroup)
            .legend(dc.legend());

        hoursPerPerson.render();

        let highEarningGroup = custom_dimension.group().reduceSum(function (d) {
            return d.timecard_hours * profile_data[0].fields.hourly;
        });

        let topEarningProjects = dc.rowChart("#top_earning_projects");
        topEarningProjects.dimension(custom_dimension).group(highEarningGroup);

        topEarningProjects.render();
        $(window).resize(function () {
            dc.redrawAll();
            barChart.resetSvg();
            barChart.render()
        });
    }


    static get_projects(project_data, timecard_data, profile_data) {
        console.log(profile_data);
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

        let profileHash = {};
        for (let i = 0; i < profile_data.length; i++) {
            profileHash[profile_data[i].pk] = profile_data[i].fields;
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

            .size(10)
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
                                //console.log(timecard_parsed[i]);
                                console.log(timecard_parsed[i]['timecard_expenditure']);
                                total += timecard_parsed[i]['timecard_hours']
                                    * profileHash[timecard_parsed[i].timecard_owner].hourly
                                    +timecard_parsed[i]['timecard_expenditure'];
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
        let barChart = dc.barChart("#bar_chart");
        console.log(timecard_parsed[timecard_parsed.length-1].timecard_project)
        barChart
            .x(d3.scale.linear().domain([1,13]))
            .xUnits(dc.units.integers)
            .xAxisLabel('Project ID')
            .yAxisLabel('Hours Worked')
            .dimension(project_filter.dimension["pk"])
            .group(hoursGroup);

        barChart.brushOn(true);
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


    static get_data_for_project_detail(timecard_data, user_data, task_data,
                                       expenditure_data, profile_data, project_data) {
        console.log(timecard_data);
        console.log(task_data);
        console.log(user_data);
        console.log(expenditure_data);
        console.log(profile_data);
        console.log(project_data);

        let taskDataHash = {};
        for (let i = 0; i < task_data.length; i++) {
            taskDataHash[task_data[i].pk] = task_data[i].fields;
        }

        let profileHash = {};
        for (let i = 0; i < profile_data.length; i++) {
            profileHash[profile_data[i].pk] = profile_data[i].fields;
        }
        console.log(taskDataHash);
        let master_timecard = [];
        for (let i = 0; i < timecard_data.length; i++) {
            master_timecard[i] = timecard_data[i].fields;
            master_timecard[i].pk = timecard_data[i].pk;
        }
        for (let x = 0; x < expenditure_data.length; x++) {
            let found = 0;
            for (let i = 0; i < master_timecard.length; i++) {
                if (master_timecard[i].timecard_date === expenditure_data[x].fields.date) {
                    console.log("ADDED");
                    master_timecard[i].expenditures = expenditure_data[x].fields;
                    found = 1;
                    break;
                }
            }
            if (0 === found) {
                master_timecard.push({expenditures: expenditure_data[x].fields})
            }

        }
        console.log(master_timecard);
        // Create crossfilter for project data
        let project_filter = new DataVisualization(master_timecard);

        //Create dimension for which we will group
        // Example: we pick dimension pk (x-axis), for which values will be grouped
        project_filter.generateDimension("timecard_date");
        project_filter.generateDimension("timecard_owner");
        project_filter.generateDimension("timecard_task");
        project_filter.generateDimension("expenditures");
        let custom_dimension = project_filter.ndx.dimension(function (d) {
            return user_data[d.timecard_owner - 1].fields.first_name;
        });

        let taskTableChart = dc.dataTable("#task_detail_table");
        taskTableChart.order(d3.ascending).dimension(project_filter.dimension["timecard_task"])
            .group(function (d) {
                return user_data[d.timecard_owner - 1].fields.first_name + " " +
                    user_data[d.timecard_owner - 1].fields.last_name;
            }).columns([{
            label: "Date",
            format: function (d) {
                return d.timecard_date;
            }
        },
            {
                label: "Task Name",
                format: function (d) {
                    return taskDataHash[d.project_task].project_task_title;
                }
            },
            {
                label: "Hours Spent",
                format: function (d) {
                    return d.timecard_hours;
                }
            },
            {
                label: "Labor Cost",
                format: function (d) {
                    return "$" + d.timecard_hours * profileHash[d.timecard_owner].hourly;
                }
            },
            {
                label: "Expenditures",
                format: function (d) {
                    return "$ " + d.timecard_expenditure.toFixed(2);
                }
            }
        ]);

        taskTableChart.on("renderlet", function () {
            let projects = $("tbody:first");
            let overall_hours = 0;
            let overall_labor = 0;
            let overall_expend = 0;
            console.log(projects);
            for (let i = 0; i < projects.length; i++) {
                let total_hours = 0;
                let total_labor = 0;
                let total_expend = 0;
                let row_list = $(projects[i]).find(".dc-table-row");
                let hours_list = $(projects[i]).find(".dc-table-column._1");
                for (let x = 0; x < row_list.length; x++) {
                    console.log($(row_list[x]).children("._2"));
                    total_hours += parseFloat($(row_list[x]).children("._2")[0].textContent);
                    total_labor += parseFloat($(row_list[x]).children("._3")[0].textContent.substr(1));
                    total_expend += parseFloat($(row_list[x]).children("._4")[0].textContent.substr(1));
                }

                $(projects[i]).append("<tr class='row_total'><td><b>Totals:</b></td><td><b class='_1'></b></td><td><b class='_2'>" + total_hours +
                    "</b></td><td><b class='_3'>$" + total_labor + "</b></td><td><b class='_4'>$" + total_expend + "</b></tr>")
            }
            let row_totals = $("#task_detail_table>tbody>.row_total");
            console.log(row_totals.length)
            for (let i = 0; i < row_totals.length; i++) {
                overall_hours += parseFloat($(row_totals[i]).find("._2")[0].textContent);
                overall_labor += parseFloat($(row_totals[i]).find("._3")[0].textContent.substr(1));
                overall_expend += parseFloat($(row_totals[i]).find("._4")[0].textContent.substr(1));
            }
            $("#task_detail_table > tbody:last").append("<tr class='row_total'><td><b>Overall:</b></td><td><b></b></td><td><b>" + overall_hours +
                "</b></td><td><b>$" + overall_labor + "</b></td><td><b>$" + overall_expend  + "</b></td></tr>");
        });
        taskTableChart.render();

        let materialCostTable = dc.dataTable("#material_cost_table");
        materialCostTable.order(d3.ascending).dimension(project_filter.dimension["expenditures"])
            .group(function (d) {
                return ""
            }).columns([
            {
                label: "Date",
                format: function (d) {
                    if (d.expenditures === undefined) {
                        return null;
                    }
                    return d.expenditures.date;
                }
            },
            {
                label: "Cost",
                format: function (d) {
                    if (d.expenditures === undefined) {
                        return null;
                    }
                    return "$" + d.expenditures.cost;
                }
            }
        ]);
        materialCostTable.on("renderlet", function () {
            let value_list = $("#material_cost_table").find(".dc-table-column._0");
            console.log(value_list);
            for (let i = 0; i < value_list.length; i++) {
                console.log(value_list[i].textContent.length)
                if (value_list[i].textContent.length < 1) {
                    console.log("Removing");
                    $(value_list[i]).parent().remove();
                }
            }
        });
        materialCostTable.render();

        let hoursPerPerson = dc.pieChart("#perPersonHours");
        let hoursPerPersonGroup = custom_dimension.group().reduceSum(
            function (d) {
                return d.timecard_hours;
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
                p.tot += v.timecard_hours;
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
            return d.tot;
        };
        let totalHoursWorked = dc.numberDisplay("#total_hours");
        totalHoursWorked.group(timecardHoursGroup).dimension(project_filter.dimension["timecard_date"]).valueAccessor(total);
        totalHoursWorked.render();

        let timecardChargeGroup = project_filter.ndx.groupAll().reduce(
            function (p, v) {
                ++p.n;
                p.tot += v.timecard_hours * profileHash[v.timecard_owner].hourly;
                return p;
            },
            function (p, v) {
                --p.n;
                p.tot -= v.timecard_hours * profileHash[v.timecard_owner].hourly;
                return p;
            },
            function () {
                return {n: 0, tot: 0};
            }
        );
        let chargesTotal = dc.numberDisplay("#total_charges");
        chargesTotal.group(timecardChargeGroup).dimension(project_filter.dimension["timecard_date"]).valueAccessor(total);
        chargesTotal.render();


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

        let totalChargesChart = dc.lineChart("#total_charges_chart");
        let totalChargesGroup = project_filter.dimension["timecard_date"].group().reduceSum(
            function (d) {
                let total = 0;
                for (let i = 0; i < timecard_data.length; i++) {
                    let this_date = d.timecard_date.split("-");
                    let other_date = timecard_data[i].fields.timecard_date.split("-");
                    if (new Date(this_date[0], this_date[1], this_date[2]) >= new Date(other_date[0], other_date[1], other_date[2]) &&
                        d.timecard_owner === timecard_data[i].fields.timecard_owner) {
                        total += d.timecard_hours * profileHash[d.timecard_owner].hourly;
                    }

                }
                return d.timecard_hours * profileHash[d.timecard_owner].hourly;
            }
        );
        totalChargesChart
            .x(d3.scale.ordinal())
            .xUnits(dc.units.ordinal)
            .xAxis().tickFormat(function (d) {
            return d.substr(8)
        });

        totalChargesChart
            .xAxisLabel('Date')
            .yAxisLabel('Labor Charges')
            .dimension(project_filter.dimension["timecard_date"])
            .group(totalChargesGroup).renderArea(true);

        totalChargesChart.render();
        $(window).resize(function () {
            hoursPerPerson.resetSvg();
            hoursWorked.resetSvg();
            totalChargesChart.resetSvg();
            dc.renderAll()
        });
    }

    static getExpectedIncome(timecard_data, user_data, task_data,
                             expenditure_data, profile_data, project_data) {
        console.log(timecard_data);
        console.log(task_data);
        console.log(user_data);
        console.log(expenditure_data);
        console.log(profile_data);
        console.log(project_data);

        let taskDataHash = {};
        for (let i = 0; i < task_data.length; i++) {
            taskDataHash[task_data[i].pk] = task_data[i].fields;
        }

        let profileHash = {};
        for (let i = 0; i < profile_data.length; i++) {
            profileHash[profile_data[i].pk] = profile_data[i].fields;
        }
        console.log(taskDataHash);
        let master_timecard = [];
        for (let i = 0; i < timecard_data.length; i++) {
            master_timecard[i] = timecard_data[i].fields;
            master_timecard[i].pk = timecard_data[i].pk;
        }
        for (let x = 0; x < expenditure_data.length; x++) {
            let found = 0;
            for (let i = 0; i < master_timecard.length; i++) {
                if (master_timecard[i].timecard_date === expenditure_data[x].fields.date) {
                    console.log("ADDED");
                    master_timecard[i].expenditures = expenditure_data[x].fields;
                    found = 1;
                    break;
                }
            }
            if (0 === found) {
                master_timecard.push({expenditures: expenditure_data[x].fields})
            }

        }
        console.log(master_timecard);
        // Create crossfilter for project data
        let project_filter = new DataVisualization(master_timecard);
        project_filter.generateDimension("timecard_date");
        project_filter.generateDimension("expenditures");

        let taskIncomeTable = dc.dataTable("#task_income_table");
        taskIncomeTable.order(d3.ascending).dimension(project_filter.dimension["timecard_date"])
            .group(function (d) {
                return ""
            }).columns([
            {
                label: "Date",
                format: function (d) {
                    return d.timecard_date;
                }
            },
            {
                label: "Task",
                format: function (d) {
                    return taskDataHash[d.project_task].project_task_title;
                }
            }
            ,
            {
                label: "Charged",
                format: function (d) {
                    let charge = d.timecard_hours * profileHash[d.timecard_owner].hourly;
                    charge += charge * (project_data[0].fields.labor_markup / 100);
                    return "$" + charge;
                }
            },
            {
                label: "Expected Profit",
                format: function (d) {
                    let charge = d.timecard_hours * profileHash[d.timecard_owner].hourly;
                    charge += charge * (project_data[0].fields.labor_markup / 100);
                    return "$" + (charge - (d.timecard_hours * profileHash[d.timecard_owner].hourly));
                }
            }
        ]);
        taskIncomeTable.on("renderlet", function () {
            let projects = $("#task_income_table");
            console.log(projects);
            for (let i = 0; i < projects.length; i++) {
                let total_charge = 0;
                let total_hours = 0;
                let total_labor = 0;
                let total_profit = 0;
                let row_list = $(projects[i]).find(".dc-table-row");
                for (let x = 0; x < row_list.length; x++) {
                    console.log($(row_list[x]).children("._2")[0]);
                    total_labor += parseFloat($(row_list[x]).children("._2")[0].textContent.substr(1));
                    total_profit += parseFloat($(row_list[x]).children("._3")[0].textContent.substr(1));
                }

                $(projects[i]).append("<tr><td><b>Totals:</b></td><td></td><td><b>$ " + total_labor +
                    "</b></td><td><b>$" + total_profit + "</b></td></tr>")

            }

        });
        taskIncomeTable.render();
        let materialIncomeTable = dc.dataTable("#material_income_table");
        materialIncomeTable.order(d3.ascending).dimension(project_filter.dimension["expenditures"])
            .group(function (d) {
                return ""
            }).columns([
            {
                label: "Date",
                format: function (d) {
                    if (d.expenditures === undefined) {
                        return null;
                    }
                    return d.expenditures.date;
                }
            },
            {
                label: "Cost",
                format: function (d) {
                    if (d.expenditures === undefined) {
                        return null;
                    }
                    let charge = d.expenditures.cost;
                    charge += charge * (project_data[0].fields.material_markup / 100);
                    return "$" + charge;
                }
            }
        ]);
        materialIncomeTable.on("renderlet", function () {
            let value_list = $("#material_income_table").find(".dc-table-column._0");
            console.log(value_list);
            for (let i = 0; i < value_list.length; i++) {
                console.log(value_list[i].textContent.length);
                if (value_list[i].textContent.length < 1) {
                    console.log("Removing");
                    $(value_list[i]).parent().remove();
                }
            }
        });
        materialIncomeTable.render();

        let hoursWorked = dc.barChart("#income_chart");
        let hoursWorkedPerDay = project_filter.dimension["timecard_date"].group().reduceSum(
            function (d) {
                let income = d.timecard_hours * profileHash[d.timecard_owner].hourly;
                income += income * (project_data[0].fields.labor_markup / 100);
                return income;
            }
        );
        hoursWorked
            .x(d3.scale.ordinal())
            .xUnits(dc.units.ordinal)
            .xAxis().tickFormat(function (d) {
            return d.substr(6).replace("-", "/");
        });

        hoursWorked
            .brushOn(true)
            .xAxisLabel('Date')
            .yAxisLabel('Profit per Day')
            .dimension(project_filter.dimension["timecard_date"])
            .group(hoursWorkedPerDay);

        hoursWorked.render();
        let profitChart = dc.lineChart("#profit_chart");
        let profitChartGroup = project_filter.dimension["timecard_date"].group().reduceSum(
            function (d) {
                let income = d.timecard_hours * profileHash[d.timecard_owner].hourly;
                income += income * (project_data[0].fields.labor_markup / 100);
                let outlays = d.timecard_hours * profileHash[d.timecard_owner].hourly;
                let profit = income - outlays;
                return profit;
            }
        );
        profitChart
            .renderArea(true)
            .x(d3.scale.ordinal())
            .xUnits(dc.units.ordinal)
            .xAxis().tickFormat(function (d) {
            return d.substr(6).replace("-", "/");
        });

        profitChart
            .brushOn(true)
            .xAxisLabel('Date')
            .yAxisLabel('Income per Day')
            .dimension(project_filter.dimension["timecard_date"])
            .group(profitChartGroup);
        profitChart.y(d3.scale.linear().domain([-30, 70]));

        profitChart.render();
    }

    static getClientData(timecard_data, project_data, profile_data, tasks) {
        console.log(timecard_data);
        console.log(project_data);
        console.log(profile_data);
        console.log(tasks)
        let profileHash = {};
        for (let i = 0; i < profile_data.length; i++) {
            profileHash[profile_data[i].pk] = profile_data[i].fields;
        }
        console.log(profileHash);
        let master_timecard = [];
        for (let i = 0; i < timecard_data.length; i++) {
            master_timecard[i] = timecard_data[i].fields;
            master_timecard[i].pk = timecard_data[i].pk;
        }

        let projectDataHash = {};
        for (let i = 0; i < project_data.length; i++) {
            projectDataHash[project_data[i].pk] = project_data[i].fields;
        }

        let projectTaskHash = {};
        for (let i = 0; i < tasks.length; i++) {
            projectTaskHash[tasks[i].fields.project_task_link] = tasks[i].fields;
        }
        console.log(projectTaskHash);
        let timecard_filter = new DataVisualization(master_timecard);
        timecard_filter.generateDimension("timecard_date");
        timecard_filter.generateDimension("timecard_project");

        let barChart = dc.barChart("#total_owed");
        let hoursGroup = timecard_filter.dimension["timecard_date"].group().reduceSum(
            function (d) {
                let charge = d.timecard_hours * profileHash[d.timecard_owner].hourly;
                charge += charge * (projectDataHash[d.timecard_project].labor_markup / 100);
                return d.timecard_hours;
            }
        );
        barChart
            .x(d3.scale.ordinal())
            .xUnits(dc.units.ordinal)
            .xAxis().tickFormat(function (d) {
            return d.substr(6).replace("-", "/")
        });

        barChart
            .brushOn(true)
            .xAxisLabel('Date')
            .yAxisLabel('Total Hours Worked')
            .dimension(timecard_filter.dimension["timecard_date"])
            .group(hoursGroup);
        barChart.render();

        let totalCost = dc.lineChart("#total_cost");
        let totalCostGroup = timecard_filter.dimension["timecard_date"].group().reduceSum(
            function (d) {
                console.log(d)
                let charge = d.timecard_hours * profileHash[d.timecard_owner].hourly;
                return charge;
            }
        );
        totalCost
            .x(d3.scale.ordinal())
            .xUnits(dc.units.ordinal)
            .xAxis().tickFormat(function (d) {
            return d.substr(6).replace("-", "/")
        });

        totalCost
            .renderArea(true)
            .brushOn(true)
            .xAxisLabel('Date')
            .yAxisLabel('Labor Cost')
            .dimension(timecard_filter.dimension["timecard_date"])
            .group(totalCostGroup);
        totalCost.render();


        let taskTableChart = dc.dataTable("#client_detail");
        taskTableChart.order(d3.ascending).dimension(timecard_filter.dimension["timecard_project"])
            .group(function (d) {
                return projectDataHash[d.timecard_project].project_name;
            }).columns([{
            label: "Project Task",
            format: function (d) {
                console.log(d.timecard_project)
                return projectTaskHash[d.timecard_project].project_task_title;
            }
        },
            {
                label: "Hours Worked",
                format: function (d) {
                    return d.timecard_hours;
                }
            }
            ,
            {
                label: "Labor Cost",
                format: function (d) {
                    let charge = d.timecard_hours * profileHash[d.timecard_owner].hourly;
                    return "$" + charge;
                }
            }
            ,
            {
                label: "Task Charge",
                format: function (d) {
                    let charge = d.timecard_hours * profileHash[d.timecard_owner].hourly;
                    charge += charge * (projectDataHash[d.timecard_project].labor_markup / 100);
                    return "$" + charge;
                }
            }
            ,
            {
                label: "Profit",
                format: function (d) {
                    let charge = d.timecard_hours * profileHash[d.timecard_owner].hourly;
                    charge += charge * (projectDataHash[d.timecard_project].labor_markup / 100);
                    return "$" + parseFloat(charge - d.timecard_hours * profileHash[d.timecard_owner].hourly);
                }
            }
        ]);
        let custom_dimension = timecard_filter.ndx.dimension(function (d) {
            return projectDataHash[d.timecard_project].project_name;
        });
        taskTableChart.on("renderlet", function () {
            let projects = $("tbody");
            let overall_hours = 0;
            let overall_labor = 0;
            let overall_charge = 0;
            let overall_profit = 0;
            console.log(projects);
            for (let i = 0; i < projects.length; i++) {
                let total_charge = 0;
                let total_hours = 0;
                let total_labor = 0;
                let total_profit = 0;
                let row_list = $(projects[i]).find(".dc-table-row");
                let hours_list = $(projects[i]).find(".dc-table-column._1");
                for (let x = 0; x < row_list.length; x++) {
                    console.log($(row_list[x]).children("._2"));
                    total_charge += parseFloat($(row_list[x]).children("._3")[0].textContent.substr(1));
                    total_hours += parseFloat($(row_list[x]).children("._1")[0].textContent);
                    total_labor += parseFloat($(row_list[x]).children("._2")[0].textContent.substr(1));
                    total_profit += parseFloat($(row_list[x]).children("._4")[0].textContent.substr(1));
                }

                $(projects[i]).append("<tr class='row_total'><td><b>Totals:</b></td><td><b class='_1'>" + total_hours + "</b></td><td><b class='_2'>$" + total_labor +
                    "</b></td><td><b class='_3'>$" + total_charge + "</b></td><td><b class='_4'>$ " + total_profit + "</b></td></tr>")
            }
            let row_totals = $(".row_total");
            console.log(row_totals);
            for (let i = 0; i < row_totals.length; i++) {
                console.log(row_totals[i])
                console.log($(row_totals[i]).find("._2")[0].textContent)
                overall_charge += parseFloat($(row_totals[i]).find("._3")[0].textContent.substr(1));
                overall_hours += parseFloat($(row_totals[i]).find("._1")[0].textContent);
                overall_labor += parseFloat($(row_totals[i]).find("._2")[0].textContent.substr(1));
                overall_profit += parseFloat($(row_totals[i]).find("._4")[0].textContent.substr(1));
            }
            $("tbody:last").append("<tr class='row_total'><td><b>Overall:</b></td><td><b>" + overall_hours + "</b></td><td><b>$" + overall_labor +
                "</b></td><td><b>$" + overall_charge + "</b></td><td><b>$ " + overall_profit + "</b></td></tr>");
        });
        taskTableChart.render();


        let hoursPerPerson = dc.pieChart("#client_projects");
        let hoursPerPersonGroup = custom_dimension.group().reduceSum(
            function (d) {
                console.log(projectDataHash[d.timecard_project].project_name);
                return d.timecard_project;
            }
        );
        hoursPerPerson

            .dimension(custom_dimension)
            .group(hoursPerPersonGroup)
            .legend(dc.legend());

        hoursPerPerson.render();
    }

    static processTimecardData(data) {
        console.log(data);


    }

};