// model export for suitcase table/model
module.exports = function (sequelize, DataTypes) {
    var Suitcase = sequelize.define("Suitcase", {
        start_date: {
            type: DataTypes.DATEONLY,
            // restrict start date from being entered if it doesn't have a text value
            allowNull: false
        },
        end_date: {
            type: DataTypes.DATEONLY,
            // restrict end date from being entered if it doesn't have a text value
            allowNull: false
        },
        travel_category: {
            type: DataTypes.ENUM,
            values: ['business', 'leisure', 'adventure', 'vacation'],
            // restrict travel category from being entered if no option has been selected
            allowNull: false
        },
        note_title: {
            type: DataTypes.TEXT,
            // restrict note title so that it cannot be null
            allowNull: false,
            defalutValue: "Suitcase Note Title"
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: false,
            defalutValue: "Suitcase Note"
        }
    }, {
            // disable timestamps
            timestamps: false,
            // by setting paranoid to true, a deleted record will not be returned in future queries
            paranoid: true,
            underscored: true
        }
    );

    Suitcase.associate = function (models) {
        Suitcase.belongsTo(models.User);

        Suitcase.belongsTo(models.Locale);

        Suitcase.belongsToMany(models.Item, {
            through: "suitcase_items",
            onDelete: "cascade",
            timestamps: false
        });
    };

    return Suitcase;
};