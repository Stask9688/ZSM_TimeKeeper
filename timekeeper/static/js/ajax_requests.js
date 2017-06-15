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
                parsed_data.push(data_object[index]["fields"]);
            }
            let project_filter = new DataVisualization(parsed_data);
            project_filter.generateDimension("project_name");
            project_filter.generateDimension("project_description");
            let tableChart = dc.dataTable("#project_table");
            project_filter.ndx.groupAll();
            tableChart.width(768).height(480)
                .dimension(project_filter.dimension["project_name"])
                .group(function () {
                    return "";
                }).columns([
                {
                    label: "Project Name",
                    format: function (d) {
                        return d.project_name;
                    }
                }, {
                    label: "Project Description",
                    format: function (d) {
                        return d.project_description;
                    }
                }]);
            dc.renderAll();
        });

    }
}
