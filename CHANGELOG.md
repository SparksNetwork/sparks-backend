<a name="1.0.38"></a>
## [1.0.38](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.37...v1.0.38) (2016-10-06)



<a name="1.0.37"></a>
## [1.0.37](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.36...v1.0.37) (2016-10-06)



<a name="1.0.36"></a>
## [1.0.36](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.35...v1.0.36) (2016-10-06)



<a name="1.0.35"></a>
## [1.0.35](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.34...v1.0.35) (2016-09-24)


### Features

* **Engagements:** Make sure engagements are unique before creating them ([8241252](https://github.com/SparksNetwork/sparks-backend/commit/8241252))



<a name="1.0.34"></a>
## [1.0.34](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.33...v1.0.34) (2016-09-22)



<a name="1.0.33"></a>
## [1.0.33](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.32...v1.0.33) (2016-09-22)


### Bug Fixes

* **CI:** Tell slack about the build after incrementing the version ([090aee3](https://github.com/SparksNetwork/sparks-backend/commit/090aee3))



<a name="1.0.32"></a>
## [1.0.32](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.31...v1.0.32) (2016-09-22)


### Bug Fixes

* **find-by-script:** remove data dump.  no sensitive info. ([3b4f1d2](https://github.com/SparksNetwork/sparks-backend/commit/3b4f1d2))


### Features

* **find-by-script:** can run find-by at command line to search for records by field ([f2976a2](https://github.com/SparksNetwork/sparks-backend/commit/f2976a2))



<a name="1.0.31"></a>
## [1.0.31](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.30...v1.0.31) (2016-09-21)



<a name="1.0.30"></a>
## [1.0.30](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.29...v1.0.30) (2016-09-21)


### Bug Fixes

* **GatewayCustomers:** context assignment needs to happen to the model ([fbb8675](https://github.com/SparksNetwork/sparks-backend/commit/fbb8675))



<a name="1.0.29"></a>
## [1.0.29](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.28...v1.0.29) (2016-09-21)


### Features

* **Build:** Add sourcemap support ([116b33a](https://github.com/SparksNetwork/sparks-backend/commit/116b33a))
* **Engagements:** Add reclaim command for engagements ([6b793de](https://github.com/SparksNetwork/sparks-backend/commit/6b793de))
* **Engagements:** Bill using a braintree subscription instead of transaction ([cd9c645](https://github.com/SparksNetwork/sparks-backend/commit/cd9c645))
* **Engagements:** Create a subscription instead of a transaction ([0862aee](https://github.com/SparksNetwork/sparks-backend/commit/0862aee))
* **Engagements:** Move the payment data into an object under Engagement ([e993f6b](https://github.com/SparksNetwork/sparks-backend/commit/e993f6b))



<a name="1.0.28"></a>
## [1.0.28](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.27...v1.0.28) (2016-09-18)



<a name="1.0.27"></a>
## [1.0.27](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.26...v1.0.27) (2016-09-18)



<a name="1.0.26"></a>
## [1.0.26](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.25...v1.0.26) (2016-09-17)


### Bug Fixes

* **Build:** Don't delete all calls with 3 arguments ([b4861ff](https://github.com/SparksNetwork/sparks-backend/commit/b4861ff))



<a name="1.0.25"></a>
## [1.0.25](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.24...v1.0.25) (2016-09-17)


### Bug Fixes

* **FirebaseGet:** Properly filter out all non-spec properties ([ea2caec](https://github.com/SparksNetwork/sparks-backend/commit/ea2caec))
* **Test:** Only run tests for run file ([8e57110](https://github.com/SparksNetwork/sparks-backend/commit/8e57110))



<a name="1.0.24"></a>
## [1.0.24](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.23...v1.0.24) (2016-09-16)


### Bug Fixes

* **Firebase:** Only initialize firebase module once ([3933214](https://github.com/SparksNetwork/sparks-backend/commit/3933214))



<a name="1.0.23"></a>
## [1.0.23](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.22...v1.0.23) (2016-09-16)



<a name="1.0.22"></a>
## [1.0.22](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.21...v1.0.22) (2016-09-16)



<a name="1.0.21"></a>
## [1.0.21](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.20...v1.0.21) (2016-09-16)


### Features

* **Dispatch:** Add ping/pong so that dispatch is constantly being run and tested ([7fe9bd3](https://github.com/SparksNetwork/sparks-backend/commit/7fe9bd3))
* **Metrics:** Add a metric aggregation program ([70090fb](https://github.com/SparksNetwork/sparks-backend/commit/70090fb))
* **Metrics:** Add metric removal program ([8962af1](https://github.com/SparksNetwork/sparks-backend/commit/8962af1))



<a name="1.0.20"></a>
## [1.0.20](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.19...v1.0.20) (2016-09-15)


### Features

* **application-cleanup:** alright you bastards ill fix the test ([55bc790](https://github.com/SparksNetwork/sparks-backend/commit/55bc790))
* **application-cleanup:** new engagements dont get the isApplied flag, it only comes from an update ([a661b79](https://github.com/SparksNetwork/sparks-backend/commit/a661b79))



<a name="1.0.19"></a>
## [1.0.19](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.18...v1.0.19) (2016-09-06)



<a name="1.0.18"></a>
## [1.0.18](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.17...v1.0.18) (2016-09-03)


### Bug Fixes

* **CI:** submit version param to sparks-bi instead of tag ([3ed7ed1](https://github.com/SparksNetwork/sparks-backend/commit/3ed7ed1))



<a name="1.0.17"></a>
## [1.0.17](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.16...v1.0.17) (2016-09-03)


### Features

* **CI:** Read the version from the package.json file with jq ([64efe7b](https://github.com/SparksNetwork/sparks-backend/commit/64efe7b))



<a name="1.0.16"></a>
## [1.0.16](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.15...v1.0.16) (2016-09-03)



<a name="1.0.15"></a>
## [1.0.15](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.14...v1.0.15) (2016-08-31)


### Features

* **Shifts:** Delete assignments when deleting shifts ([f390057](https://github.com/SparksNetwork/sparks-backend/commit/f390057))



<a name="1.0.14"></a>
## [1.0.14](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.13...v1.0.14) (2016-08-30)



<a name="1.0.13"></a>
## [1.0.13](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.12...v1.0.13) (2016-08-30)



<a name="1.0.12"></a>
## [1.0.12](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.11...v1.0.12) (2016-08-30)



<a name="1.0.11"></a>
## [1.0.11](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.10...v1.0.11) (2016-08-30)



<a name="1.0.10"></a>
## [1.0.10](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.9...v1.0.10) (2016-08-21)


### Features

* **Changelog:** Push changelog information to bi project ([d00edbc](https://github.com/SparksNetwork/sparks-backend/commit/d00edbc))



<a name="1.0.9"></a>
## [1.0.9](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.8...v1.0.9) (2016-08-20)



<a name="1.0.8"></a>
## [1.0.8](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.7...v1.0.8) (2016-08-19)



<a name="1.0.7"></a>
## [1.0.7](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.6...v1.0.7) (2016-08-19)



<a name="1.0.6"></a>
## [1.0.6](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.5...v1.0.6) (2016-08-19)



<a name="1.0.5"></a>
## [1.0.5](https://github.com/SparksNetwork/sparks-backend/compare/v1.0.4...v1.0.5) (2016-08-19)



<a name="1.0.4"></a>
## [1.0.4](https://github.com/sdebaun/sparks-backend/compare/v1.0.3...v1.0.4) (2016-08-18)



<a name="1.0.3"></a>
## [1.0.3](https://github.com/sdebaun/sparks-backend/compare/v1.0.2...v1.0.3) (2016-08-18)


### Bug Fixes

* **Engagements:** Add the engagement key when sending acceptance emails ([79cb13f](https://github.com/sdebaun/sparks-backend/commit/79cb13f))
* **Engagements:** Add the engagement key when sending confirmation emails ([7ea5668](https://github.com/sdebaun/sparks-backend/commit/7ea5668))
* **Memberships:** Create from values ([5365ad4](https://github.com/sdebaun/sparks-backend/commit/5365ad4))
* **Memberships:** Handle missing answers on create ([06e15ee](https://github.com/sdebaun/sparks-backend/commit/06e15ee))



<a name="1.0.2"></a>
## [1.0.2](https://github.com/sdebaun/sparks-backend/compare/v1.0.1...v1.0.2) (2016-08-14)



<a name="1.0.1"></a>
## [1.0.1](https://github.com/sdebaun/sparks-backend/compare/v1.0.0...v1.0.1) (2016-08-11)


### Features

* **Changelog:** Add changelog generation to circleci ([0c28d7b](https://github.com/sdebaun/sparks-backend/commit/0c28d7b))



<a name="1.0.0"></a>
# 1.0.0 (2016-08-04)


### Bug Fixes

* **Arrivals,Seneca:** Fix the expected arguments of the arrivals create action ([2f8326a](https://github.com/sdebaun/sparks-backend/commit/2f8326a))
* fix filtering by project name ([2a6443b](https://github.com/sdebaun/sparks-backend/commit/2a6443b))
* **AcceptedEmail:** When turning on Opp confirmations set engagement key for accepted emails ([d974407](https://github.com/sdebaun/sparks-backend/commit/d974407))
* **Assigments:** fix deleting an assigment ([9cf993d](https://github.com/sdebaun/sparks-backend/commit/9cf993d))
* **Assignemnts:** do not attempt to update shift count if assignment has no shift key ([3af8929](https://github.com/sdebaun/sparks-backend/commit/3af8929))
* **deploy:** add babel-cli to dependencies ([4991cbc](https://github.com/sdebaun/sparks-backend/commit/4991cbc))
* **Deploy:** Fix the same of the heroku repo ([e1fae35](https://github.com/sdebaun/sparks-backend/commit/e1fae35))
* **Dispatch:** don't crash when task cannot be processed ([ed30148](https://github.com/sdebaun/sparks-backend/commit/ed30148))
* **Engagements:** look up profiles by engagement.profileKey ([5d9862e](https://github.com/sdebaun/sparks-backend/commit/5d9862e))
* **injection:** incorrect initialization of getStuff ([fc55a83](https://github.com/sdebaun/sparks-backend/commit/fc55a83))
* **Memberships:** fix missing answer ([9974237](https://github.com/sdebaun/sparks-backend/commit/9974237))
* **Organizers:** Do not check that organizer email matches invite ([fec5108](https://github.com/sdebaun/sparks-backend/commit/fec5108))
* Fix the image uploading by returning the set promise, otherwise it does not run ([6f8289e](https://github.com/sdebaun/sparks-backend/commit/6f8289e))
* fix typo ([9240819](https://github.com/sdebaun/sparks-backend/commit/9240819))
* **Pay:** A callback was being given to a thenable causing errors to be thrown when emails were sent ([1185062](https://github.com/sdebaun/sparks-backend/commit/1185062))
* **Payments:** Remove tap from promise chain ([c283935](https://github.com/sdebaun/sparks-backend/commit/c283935))
* **Profiles:** fix import line in profiles ([930b7cc](https://github.com/sdebaun/sparks-backend/commit/930b7cc))
* **ProjectImages:** allows admins to change the project image ([f9b3ff1](https://github.com/sdebaun/sparks-backend/commit/f9b3ff1))
* **ProjectImages:** fix broken image setting ([8adfb2d](https://github.com/sdebaun/sparks-backend/commit/8adfb2d))
* **Shifts:** Do not apply permissions to shifts updateCount action ([8ea4c30](https://github.com/sdebaun/sparks-backend/commit/8ea4c30))
* **Shifts:** fix typo in shifts update ([2d21656](https://github.com/sdebaun/sparks-backend/commit/2d21656))
* **ShiftUpdateCount:** Do not throw an error when seneca task fails, instead return information about the error ([1400d1b](https://github.com/sdebaun/sparks-backend/commit/1400d1b))


### Features

* [WIP] - send email when engagament is created ([489de5d](https://github.com/sdebaun/sparks-backend/commit/489de5d))
* [WIP] only send emails when confirmations are on ([8094b10](https://github.com/sdebaun/sparks-backend/commit/8094b10))
* acceptance email ([1fec498](https://github.com/sdebaun/sparks-backend/commit/1fec498))
* add ability to add image ([7534463](https://github.com/sdebaun/sparks-backend/commit/7534463))
* automatic engagement creation email with template ([4dd266b](https://github.com/sdebaun/sparks-backend/commit/4dd266b))
* bacis create and update shifts ([970d1c9](https://github.com/sdebaun/sparks-backend/commit/970d1c9))
* **Arrivals:** Implement arrival creation ([d7217dc](https://github.com/sdebaun/sparks-backend/commit/d7217dc))
* **ConfirmWithoutPay:** implement confirm without pay action ([3f3bd5f](https://github.com/sdebaun/sparks-backend/commit/3f3bd5f))
* **Deploy:** Auto deploy backend to production on master branch pushes ([c0085cf](https://github.com/sdebaun/sparks-backend/commit/c0085cf))
* **Engagements:** send confirmation email ([8c3693b](https://github.com/sdebaun/sparks-backend/commit/8c3693b))
* **Export:** Do not load all engagements ([337afb3](https://github.com/sdebaun/sparks-backend/commit/337afb3))
* **Organizers:** send email to invite organizers ([5a18016](https://github.com/sdebaun/sparks-backend/commit/5a18016))
* **Organizers:** Update all security rules to reflect that organizers ([817d44c](https://github.com/sdebaun/sparks-backend/commit/817d44c))
* **Seneca:** implement all actions as seneca services ([9357ab2](https://github.com/sdebaun/sparks-backend/commit/9357ab2))



