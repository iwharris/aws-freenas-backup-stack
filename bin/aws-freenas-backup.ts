#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { AwsFreenasBackupStack } from '../lib/aws-freenas-backup-stack';

const app = new cdk.App();
new AwsFreenasBackupStack(app, 'AwsFreenasBackupStack');
