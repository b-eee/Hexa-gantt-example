export class Utils {
    static generatePayload(datastore_id, sort) {
        return {
          "datastore_id": datastore_id,
          "per_page": 1000,
          "page": 1,
          "use_field_id": true,
          "sort_field_id": sort,
          "sort_order": "asc"
        }
    }

    static generateItemsPayload(datastore_id, from, to) {
      return {
        "datastore_id": datastore_id,
        "per_page": 1000,
        "page": 1,
        "use_field_id": true,
        "include_links": true,
        "conditions": [
          {
            "id": "reservationStartDate",
            "search_value":[
              from,
              to
            ],
          },
        ]
      }
    }

    static isOutOfViewport(elem) {

      // Get element's bounding
      var bounding = elem.getBoundingClientRect();
    
      // Check if it's out of the viewport on each side
      var out = {};
      out.top = bounding.top < 0;
      out.left = bounding.left < 0;
      out.bottom = bounding.bottom > (window.innerHeight || document.documentElement.clientHeight);
      out.right = bounding.right > (window.innerWidth || document.documentElement.clientWidth);
      out.any = out.top || out.left || out.bottom || out.right;
      out.all = out.top && out.left && out.bottom && out.right;
    
      return out;
    };

    static generateDateTimeByDate(targetDate, strTime) {
			if (strTime) {
				let timeArr = strTime.split(":")
				if (timeArr.length == 2) {
					targetDate.setHours(timeArr[0])
					targetDate.setMinutes(timeArr[1])
				}
			}
      return targetDate;
    };

    static generateRequestTimeString(strTime) {
			if (strTime) {
				let timeArr = strTime.split(":")
				if (timeArr.length == 2) {
          return strTime + "+09:00"
				}
			}
      return null;
    };

    static leadingZero(numString, len) {
      if (!numString) { return "" }
      var s = numString+"";
      while (s.length < len) s = "0" + s;
      return s;
    }

    static UpperHex(numString, len) {
      if (!numString) { return "" }
      var s = Number(numString).toString(16).toUpperCase();
      while (s.length < len) s = "0" + s;
      return s;
    }

    static oneDayBefore(date) {
      let newDate = new Date(date)
      newDate.setDate(date.getDate() - 1);
      return newDate
    }

    static targetDateNoon(date, shift) {
      let newDate = new Date(date)
      newDate.setDate(date.getDate() + shift);
      newDate.setHours(12,30,0,0);
      return newDate;
    }

    static startingDate(date) {
      let newDate = new Date(date)
      newDate.setHours(0,0,0,0);
      return newDate;
    }
}
