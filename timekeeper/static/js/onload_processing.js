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

    static processTimecardData(data){
        console.log(data);



    }

};