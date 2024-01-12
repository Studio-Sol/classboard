import userEntity from "../models/user.entity.js";
import { ObjectId } from "bson";

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
export async function getUserById(id: any) {
    try {
        const user = await userEntity.findOne({
            _id: new ObjectId(String(id)),
        });
        if (!user) return null;
        else return user;
    } catch (_) {
        return null;
    }
}
export function Date2NeisDate(date: Date) {
    return `${date.getFullYear()}${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}`;
}
export function NeisDate2Date(date: string) {
    return new Date(
        `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`
    );
}
