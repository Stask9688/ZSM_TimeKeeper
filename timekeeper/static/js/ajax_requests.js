/**
 * Created by Stas on 6/6/2017.
 */


function success(){

}

function project_data_request(return_data){
    $.get("/project_data",{name:"Test project"}).
        done(function(data){
            data_object=JSON.parse(data);
            console.log(data_object[0].fields);
            return_data = data_object[0].fields;
       console.log("Data loaded: ",data)
    });

}
