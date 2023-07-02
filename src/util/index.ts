import { ObjectID } from "bson";
import userEntity from "../models/user.entity.js";

export function getMondayDate(paramDate: Date) {
    paramDate.setUTCHours(0, 0, 0, 0);

    var day = paramDate.getDay();
    if (day == 6) var diff = paramDate.getDate() + 2;
    else var diff = paramDate.getDate() - day + 1;
    var result = new Date(paramDate.setDate(diff))
        .toISOString()
        .substring(0, 10);
    return result;
}

// python random.choice
export function choice(a: string, k = 1) {
    var return_array = [];
    for (var i = 0; i < k; i++) {
        return_array.push(a[Math.floor(Math.random() * a.length)]);
    }
    return return_array;
}
export async function getUserById(id: ObjectID | string) {
    return await userEntity.findOne({ _id: new ObjectID(id) });
}
