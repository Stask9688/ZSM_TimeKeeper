/**
 * Created by Stas on 6/15/2017.
 */
var DataVisualization = class {
    constructor(data) {
        this.data = [];
        this.ndx = crossfilter(data);
        this.dimension = {};
    }

    generateDimension(value) {
        this.dimension[value] = this.ndx.dimension(function (d) {
            return d[value];
        });
    }

    generateGroup(value) {
        this.group[value] = this.nds.group
    }
};