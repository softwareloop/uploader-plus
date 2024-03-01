# Uploader Plus - an Alfresco uploader that prompts for metadata.

## Updated to make it compatible with ACS 6.x and 7.x 

A plugin that enhances the standard Alfresco uploader with a mechanism to prompt
the user for content type and metadata during the upload process.

![upload-metadata-620x494](https://github.com/softwareloop/uploader-plus/wiki/images/home/upload-metadata-620x494.png)

Documentation:

* [Introduction](https://github.com/softwareloop/uploader-plus/wiki)
* [Installation](https://github.com/softwareloop/uploader-plus/wiki/Installation)
* [Configuration](https://github.com/softwareloop/uploader-plus/wiki/Configuration)
* [Working with custom content types](https://github.com/softwareloop/uploader-plus/wiki/Working-with-custom-content-types)
* [Compatibility tests](https://github.com/softwareloop/uploader-plus/wiki/Compatibility-tests)
* [Working with Maven](https://github.com/softwareloop/uploader-plus/wiki/Working-with-Maven)

Maintainers:

* [Paolo Predonzani](https://github.com/softwareloop)
* [Douglas C. R. Paes](https://github.com/douglascrp)
* [Younes Regaieg](https://github.com/yregaieg)

Contributors:

* [Axel Faust](https://github.com/AFaust)
* [Stéphane Prouvez](https://github.com/sprouvez)
* [Oksana Kurysheva](https://github.com/aviriel)
* [Magnus Pedersen](https://github.com/magp3)
* [Alexander Mahabir](https://github.com/alex4u2nv)
* [Roxana Angheluta](https://github.com/anghelutar)
* [tomasrgar](https://github.com/tomasrgar)
* [Tom Vandepoele](https://github.com/tom-vandepoele)



Run with `./run.sh build_start` or `./run.bat build_start` and verify that it

 * Runs Alfresco Content Service (ACS)
 * Runs Alfresco Share
 * Runs Alfresco Search Service (ASS)
 * Runs PostgreSQL database
 * Deploys the JAR assembled modules
 
All the services of the project are now run as docker containers. The run script offers the next tasks:

 * `build_start`. Build the whole project, recreate the ACS and Share docker images, start the dockerised environment composed by ACS, Share, ASS and 
 PostgreSQL and tail the logs of all the containers.
 * `build_start_it_supported`. Build the whole project including dependencies required for IT execution, recreate the ACS and Share docker images, start the 
 dockerised environment composed by ACS, Share, ASS and PostgreSQL and tail the logs of all the containers.
 * `start`. Start the dockerised environment without building the project and tail the logs of all the containers.
 * `stop`. Stop the dockerised environment.
 * `purge`. Stop the dockerised container and delete all the persistent data (docker volumes).
 * `tail`. Tail the logs of all the containers.
 * `reload_share`. Build the Share module, recreate the Share docker image and restart the Share container.
 * `reload_acs`. Build the ACS module, recreate the ACS docker image and restart the ACS container.
 * `build_test`. Build the whole project, recreate the ACS and Share docker images, start the dockerised environment, execute the integration tests from the
 `integration-tests` module and stop the environment.
 * `test`. Execute the integration tests (the environment must be already started).