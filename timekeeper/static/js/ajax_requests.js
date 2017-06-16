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

    // Very basic example, javascript inlined with html is discouraged.
class AjaxRequest {
    static get_projects() {
        $.get("/project_data", {name: "Test project"}).done(function (data) {
            let data_object = JSON.parse(data);
            let parsed_data = [];
            for (let index = 0; index < data_object.length; index++) {
                data_object[index]["fields"].pk = data_object[index].pk;
                parsed_data.push(data_object[index]["fields"]);
            }
            let project_filter = new DataVisualization(parsed_data);
            project_filter.generateDimension("project_name");
            project_filter.generateDimension("project_description");
            project_filter.generateDimension("project_hours");
            project_filter.generateDimension("pk");
            let tableChart = dc.dataTable("#project_table");
            project_filter.ndx.groupAll();
            tableChart.width(768).height(480)
                .dimension(project_filter.dimension["project_name"])
                .group(function () {
                    return "";
                }).columns([{
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
            let hoursGroup = project_filter.dimension["pk"].group().reduceSum(
                function (d) {
                    console.log(d);
                    return d["project_hours"];
                }
            );
            console.log(parsed_data);
            let barChart = dc.barChart(" #bar_chart");
            barChart
                .x(d3.scale.ordinal())
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .xAxisLabel('Project ID')
                .yAxisLabel('Hours Worked')
                .dimension(project_filter.dimension["pk"])
                .group(hoursGroup);
            dc.renderAll();
            $(".dc-table-group").remove();
        });

    }

}

