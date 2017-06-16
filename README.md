# ZSM_TimeKeeper

This is a Django based web-accessible application for tracking and managing
employee hours and projects for a company.

### Setup:

#### Prerequisites:

- Python 3.6
- Django must be installed for the python instance you'll be running.
  Pip is installed by default with python, Django may be installed as such:
```
  C:\DirectoryWithPipInstallerExecutable> pip install Django
```


#### Project Configuration:
 1. After pulling the repo, you need to initialize the database on your system.
This is done via the following command from the project root directory:
```
    C:\ProjectRoot> python manage.py migrate
    Operations to perform:
      Apply all migrations: admin, auth, contenttypes, sessions
    Running migrations:
      Applying contenttypes.0001_initial... OK
      Applying auth.0001_initial... OK
      Applying admin.0001_initial... OK
      Applying admin.0002_logentry_remove_auto_add... OK
      Applying contenttypes.0002_remove_content_type_name... OK
      Applying auth.0002_alter_permission_name_max_length... OK
      Applying auth.0003_alter_user_email_max_length... OK
      Applying auth.0004_alter_user_username_opts... OK
      Applying auth.0005_alter_user_last_login_null... OK
      Applying auth.0006_require_contenttypes_0002... OK
      Applying auth.0007_alter_validators_add_error_messages... OK
      Applying auth.0008_alter_user_username_max_length... OK
      Applying sessions.0001_initial... OK
```

  There will no be a sqlite database in the root folder: db.sqlite

 2. Create a default user for your database. Enter following commmand
   and fill fields when prompted (simple, easy credentials recommended):
```
    C:\ProjectRoot>python manage.py createsuperuser
    Username (leave blank to use 'defaultname'):
    Email address: admin@admin.admin
    Password:
    Password (again):
    Superuser created successfully.
```



 3. Start the django server:
 ```
 C:\ProjectRoot> python manage.py runserver
 Performing system checks...

System check identified no issues (0 silenced).
June 06, 2017 - 17:19:26
Django version 1.10.6, using settings 'ZSM_TimeKeeper.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
 ```
  Open a browser, and enter http://127.0.0.1:8000/admin to take you to the
  default administrator page. You can log in with the credentials created in step 2.

 4. Populating database via fixtures:

  Fixture files are included in the Fixtures folder of the the top most directory. These
  contain JSON formatted files which may be used to populate the database models with test
  data. The default fixture directory is the Fixtures folder, any time you specify a
  fixture file to load, that folder will be checked for the name of the file.
  To apply the fixtures run the following command:
  ```
    C:\PathToProject > python manage.py loaddata <name of fixture file>
  ```

  Example to populate timecard:
  ```
  C:\PathToProject > python manage.py loaddate timecard_fixture.json
  Installed 36 object(s) from 1 fixture(s)
  ```

  The new data items should now be available in the database.