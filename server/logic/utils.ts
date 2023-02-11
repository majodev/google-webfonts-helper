import * as _ from "lodash";

export function findByValues<T extends object>(collection: T | null | undefined, property: string, values: string[]) {
    return _.filter(collection, function (item) {
        return _.includes(values, item[property]);
    });
}