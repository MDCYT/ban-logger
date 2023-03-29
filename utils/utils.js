module.exports = {

    getPeriod(period, type) {
        switch (period) {
            case 'year':
                if (type === 'current') {
                    return { $gte: new Date(new Date().getFullYear(), 0, 1) };
                } else {
                    return { $gte: new Date(new Date().getFullYear() - 1, 0, 1), $lt: new Date(new Date().getFullYear(), 0, 1) };
                }
            case 'month':
                if (type === 'current') {
                    return { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) };
                } else {
                    return { $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), $lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1) };
                }
            case 'week':
                if (type === 'current') {
                    return { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - new Date().getDay()) };
                } else {
                    return { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - new Date().getDay() - 7), $lt: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - new Date().getDay()) };
                }
            case 'day':
                if (type === 'current') {
                    return { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) };
                } else {
                    return { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 1), $lt: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) };
                }
        }
    },

    periodTranslation(period) {
        switch (period) {
            case 'year':
                return 'año';
            case 'month':
                return 'mes';
            case 'week':
                return 'semana';
            case 'day':
                return 'día';
        }
    },

    typeTranslation(type) {
        switch (type) {
            case 'current':
                return 'actual';
            case 'past':
                return 'pasado';
        }
    }
}