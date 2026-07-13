# Run Book / System Operation Manual

## Service or system overview

**Service or system name:A 3-tier e-commerce application built as a DevOps learning project across 6 phases.** 

### Technical overview

> What kind of system is this? Web-connected order processing? Back-end batch system? Internal HTTP-based API? ETL control system?

┌──────────┐    ┌──────────┐    ┌──────────┐
│  React   │───▶│  Express │───▶│ Postgres │
│ Frontend │    │   API    │    │    DB    │
└──────────┘    └──────────┘    └──────────┘

### Contributing applications, daemons, services, middleware

> Which distinct software applications, daemons, services, etc. make up the service or system? What external dependencies does it have?

1. Nodejs
2. Postgres
3. Nginx for UI
4. Docker file (api, frontend)
5. Docker Compose

## System characteristics

### Data and processing flows

> How and where does data flow through the system? What controls or triggers data flows?
curl http://localhost:3000/health
curl http://localhost:3000/api/products
curl http://localhost:8080/api/products
curl http://localhost/api/products	
curl -i http://34.203.42.8:5173/api/products
curl -i http://34.203.42.8:5173/api/cart

### Infrastructure and network design

> What servers, containers, schedulers, devices, vLANs, firewalls, etc. are needed?

AWS EC2 create using terraform file 

### Environmental differences

> What are the main differences between Production/Live and other environments? What kinds of things might therefore not be tested in upstream environments?

Diffrent envoirnment variable for diffrent envoirnments,
Plus make sure to add the IP of the VM in GitHub actions settings under 
EC2_HOST


### Tools

> What tools are available to help operate the system?

_(e.g. Use the `queue-cleardown.sh` script to safely cleardown the processing queue nightly)_

## Required resources

> What compute, storage, database, metrics, logging, and scaling resources are needed? What are the minimum and expected maximum sizes (in CPU cores, RAM, GB disk space, GBit/sec, etc.)?

### Required resources - compute

t2.medium

### Required resources - storage

volume_size = 30          # Size in GB
volume_type = "gp3"       # General Purpose SSD (recommended)
delete_on_termination = true

### Required resources - database

Postgres

### Required resources - metrics

_(e.g. Min: 100 metrics per node per minute. Max: around 6000 metrics per node per minute)_

### Required resources - logging

_(e.g. Min: 60 log lines per node per minute (100KB). Max: around 6000 log lines per node per minute (1MB))_

### Required resources - other

ami           = "ami-0ec10929233384c7f"

## Security and access control

### Password and PII security

> What kind of security is in place for passwords and Personally Identifiable Information (PII)? Are the passwords hashed with a strong hash function and salted?

Sensitive values passed through variables, that are not commited on github
.env needs to be passed manually

## System configuration

### Secrets management

> How are configuration secrets managed?
Below Secrets needs to be setup on GitHub actions

AWS_ACCESS_KEY_ID

AWS_SECRET_ACCESS_KEY

EC2_HOST (IP of the host where app will be deployed)

EC2_SSH_KEY (.pem key, make sure the user is Ubuntu in the workflow script)

GHCR_PAT (github token)

## Monitoring and alerting

### Log aggregation solution

> What log aggregation & search solution will be used?

_(e.g. The system will use the existng in-house ELK cluster. 2000-6000 messages per minute expected at normal load levels)_

### Log message format

> What kind of log message format will be used? Structured logging with JSON? `log4j` style single-line output?

_(e.g. Log messages will use log4j compatible single-line format with wrapped stack traces)_

### Events and error messages

> What significant events, state transitions and error events may be logged?

_(e.g. IDs 1000-1999: Database events; IDs 2000-2999: message bus events; IDs 3000-3999: user-initiated action events; ...)_

### Metrics

> What significant metrics will be generated?

_(e.g. Usual VM stats (CPU, disk, threads, etc.) + around 200 application technical metrics + around 400 user-level metrics)_

### Health checks

> How is the health of dependencies (components and systems) assessed? How does the system report its own health?

#### Health of dependencies

_(e.g. Use `/health` HTTP endpoint for internal components that expose it. Other systems and external endpoints: typically HTTP 200 but some synthetic checks for some services)_

#### Health of service

_(e.g. Provide `/health` HTTP endpoint: 200 --> basic health, 500 --> bad configuration + `/health/deps` for checking dependencies)_

## Operational tasks

### Deployment

> How is the software deployed? How does roll-back happen?

_(e.g. We use GoCD to coordinate deployments, triggering a Chef run pulling RPMs from the internal yum repo)_

### Batch processing

> What kind of batch processing takes place?

_(e.g. Files are pushed via SFTP to the media server. The system processes up to 100 of these per hour on a `cron` schedule)_

### Power procedures

> What needs to happen when machines are power-cycled?

_(e.g. *** WARNING: we have not investigated this scenario yet! ***)_

### Routine and sanity checks

> What kind of checks need to happen on a regular basis?

_(e.g. All `/health` endpoints should be checked every 60secs plus the synthetic transaction checks run every 5 mins via Pingdom)_

### Troubleshooting

> How should troubleshooting happen? What tools are available?

_(e.g. Use a combination of the `/health` endpoint checks and the `abc-*.sh` scripts for diagnosing typical problems)_

## Maintenance tasks

### Patching

> How should patches be deployed and tested?

#### Normal patch cycle

_(e.g. Use the standard OS patch test cycle together with deployment via Jenkins and Capistrano)_

#### Zero-day vulnerabilities

_(e.g. Use the early-warning notifications from UpGuard plus deployment via Jenkins and Capistrano)_

### Daylight-saving time changes

> Is the software affected by daylight-saving time changes (both client and server)?

_(e.g. Server clocks all set to UTC+0. All date/time data converted to UTC with offset before processing)_

### Data cleardown

> Which data needs to be cleared down? How often? Which tools or scripts control cleardown? 

_(e.g. Use `abc-cleardown.ps1` run nightly to clear down the document cache)_
 
### Log rotation

> Is log rotation needed? How is it controlled? 

_(e.g. The Windows Event Log *ABC Service* is set to a maximum size of 512MB)_

## Failover and Recovery procedures

> What needs to happen when parts of the system are failed over to standby systems? What needs to during recovery? 

### Failover

_

### Recovery

_

### Troubleshooting Failover and Recovery

> What tools or scripts are available to troubleshoot failover and recovery operations?

_(e.g. Start with running `SELECT state__desc FROM sys.database__mirroring__endpoints` on the PRIMARY node and then use the scripts in the *db-failover* Git repo)_
