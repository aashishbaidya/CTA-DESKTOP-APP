CREATE TABLE _table_main(_id_table INTEGER PRIMARY KEY AUTOINCREMENT ,_table_id Text not null ,_table_Name Text not null ,_table_date Text not null ,_table_json Text not null ,_table_Gps Text not null ,_table_photo Text not null ,_table_status Text not null ,_delete_flag Text not null,  imei Text not null );

CREATE TABLE _user(_id_table INTEGER PRIMARY KEY AUTOINCREMENT, username Text not null ,password Text not null );

-- CREATE TABLE "_table_main" (
-- 	 "person_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
-- 	 "first_name" TEXT(255,0) NOT NULL,
-- 	 "last_name" TEXT(255,0) NOT NULL
-- );
-- CREATE INDEX "first_name_index" ON people ("first_name" COLLATE NOCASE ASC);
-- CREATE INDEX "last_name_index" ON people ("last_name" COLLATE NOCASE ASC);
-- INSERT INTO `people` VALUES (NULL, "Jango", "Reinhardt"), (NULL, "Svend", "Asmussen");
