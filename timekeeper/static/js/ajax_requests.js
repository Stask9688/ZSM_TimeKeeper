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
            console.log(data_object);
            let index = 0;
            for (index; index < data_object.length; ++index) {
                let project_name = data_object[index].fields.project_name;
                let project_description = data_object[index].fields.project_description;
                $("#project_table").append("<tr><td>" + project_name + "</td>" + "<td>" + project_description + "</td></tr>");
            }
        });
    }
}
