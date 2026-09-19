locals {
  app_name = "${var.name}-${var.environment}"
  azs = var.availability_zones
  image = var.image_uri
  public_subnet_cidrs = ["10.42.0.0/20","10.42.16.0/20"]
  app_subnet_cidrs = ["10.42.32.0/20","10.42.48.0/20"]
  data_subnet_cidrs = ["10.42.64.0/20","10.42.80.0/20"]
}
resource "random_string" "cognito_suffix" { length=8 special=false upper=false }

resource "aws_vpc" "main" {
  cidr_block=var.vpc_cidr
  enable_dns_support=true
  enable_dns_hostnames=true
}
resource "aws_internet_gateway" "main" { vpc_id=aws_vpc.main.id }

resource "aws_subnet" "public" {
  count=length(local.azs)
 vpc_id=aws_vpc.main.id
  availability_zone=local.azs[count.index]
 cidr_block=local.public_subnet_cidrs[count.index]
  map_public_ip_on_launch=true
}
resource "aws_subnet" "app" {
  count=length(local.azs)
 vpc_id=aws_vpc.main.id
  availability_zone=local.azs[count.index]
 cidr_block=local.app_subnet_cidrs[count.index]
}
resource "aws_subnet" "data" {
  count=length(local.azs)
 vpc_id=aws_vpc.main.id
  availability_zone=local.azs[count.index]
 cidr_block=local.data_subnet_cidrs[count.index]
}

resource "aws_route_table" "public" {
  vpc_id=aws_vpc.main.id
  route { cidr_block="0.0.0.0/0"
 gateway_id=aws_internet_gateway.main.id }
}
resource "aws_route_table_association" "public" {
  count=length(local.azs)
 route_table_id=aws_route_table.public.id
 subnet_id=aws_subnet.public[count.index].id
}
resource "aws_eip" "nat" {
  count=var.single_nat_gateway ? 1 : length(local.azs)
 domain="vpc"
 depends_on=[aws_internet_gateway.main]
}
resource "aws_nat_gateway" "main" {
  count=var.single_nat_gateway ? 1 : length(local.azs)
  allocation_id=aws_eip.nat[var.single_nat_gateway ? 0 : count.index].id
  subnet_id=aws_subnet.public[var.single_nat_gateway ? 0 : count.index].id
  depends_on=[aws_internet_gateway.main]
}
resource "aws_route_table" "app" {
  count=length(local.azs)
 vpc_id=aws_vpc.main.id
  route { cidr_block="0.0.0.0/0"
 nat_gateway_id=aws_nat_gateway.main[var.single_nat_gateway ? 0 : count.index].id }
}
resource "aws_route_table_association" "app" {
  count=length(local.azs)
 route_table_id=aws_route_table.app[count.index].id
 subnet_id=aws_subnet.app[count.index].id
}
resource "aws_route_table" "data" { count=length(local.azs)
 vpc_id=aws_vpc.main.id }
resource "aws_route_table_association" "data" {
  count=length(local.azs)
 route_table_id=aws_route_table.data[count.index].id
 subnet_id=aws_subnet.data[count.index].id
}

resource "aws_security_group" "alb" {
  name="${local.app_name}-alb"
 description="Public ALB ingress"
 vpc_id=aws_vpc.main.id
  ingress { from_port=443
 to_port=443
 protocol="tcp"
 cidr_blocks=["0.0.0.0/0"] }
  egress { from_port=0
 to_port=0
 protocol="-1"
 cidr_blocks=["0.0.0.0/0"] }
}
resource "aws_security_group" "app" {
  name="${local.app_name}-app"
 description="Private ECS application"
 vpc_id=aws_vpc.main.id
  ingress { from_port=var.container_port
 to_port=var.container_port
 protocol="tcp"
 security_groups=[aws_security_group.alb.id] }
  egress { from_port=0
 to_port=0
 protocol="-1"
 cidr_blocks=["0.0.0.0/0"] }
}
resource "aws_security_group" "data" {
  name="${local.app_name}-data"
 description="Private RDS and Redis"
 vpc_id=aws_vpc.main.id
  ingress { from_port=5432
 to_port=5432
 protocol="tcp"
 security_groups=[aws_security_group.app.id] }
  ingress { from_port=6379
 to_port=6379
 protocol="tcp"
 security_groups=[aws_security_group.app.id] }
}

resource "aws_ecr_repository" "app" {
  name=var.name
 image_tag_mutability="IMMUTABLE"
  image_scanning_configuration { scan_on_push=true }
  encryption_configuration { encryption_type="AES256" }
}
resource "aws_ecr_lifecycle_policy" "app" {
  repository=aws_ecr_repository.app.name
  policy=jsonencode({rules=[
    {rulePriority=1,description="Keep newest 20 images",selection={tagStatus="tagged",countType="imageCountMoreThan",countNumber=20},action={type="expire"}},
    {rulePriority=2,description="Expire untagged images",selection={tagStatus="untagged",countType="sinceImagePushed",countUnit="days",countNumber=7},action={type="expire"}}
  ]})
}
resource "aws_cloudwatch_log_group" "app" { name="/ecs/${local.app_name}"
 retention_in_days=var.log_retention_days }

resource "aws_secretsmanager_secret" "gemini" { name="${local.app_name}/gemini-api-key"
 recovery_window_in_days=0 }
resource "aws_secretsmanager_secret" "binance_key" { name="${local.app_name}/binance-api-key"
 recovery_window_in_days=0 }
resource "aws_secretsmanager_secret" "binance_secret" { name="${local.app_name}/binance-api-secret"
 recovery_window_in_days=0 }
resource "aws_secretsmanager_secret" "destination_wallet" { name="${local.app_name}/destination-wallet"
 recovery_window_in_days=0 }
resource "aws_secretsmanager_secret" "destination_network" { name="${local.app_name}/destination-network"
 recovery_window_in_days=0 }

resource "aws_db_subnet_group" "main" { name="${local.app_name}-db"
 subnet_ids=aws_subnet.data[*].id }
resource "aws_db_instance" "main" {
  identifier="${local.app_name}-postgres"
 engine="postgres"
 engine_version="16"
  instance_class=var.db_instance_class
 allocated_storage=50
 max_allocated_storage=200
 storage_type="gp3"
  storage_encrypted=true
 db_name="ky7"
 username="ky7"
 manage_master_user_password=true
 multi_az=true
  db_subnet_group_name=aws_db_subnet_group.main.name
 vpc_security_group_ids=[aws_security_group.data.id]
  backup_retention_period=7
 deletion_protection=true
 skip_final_snapshot=false
  final_snapshot_identifier="${local.app_name}-final"
 publicly_accessible=false
 auto_minor_version_upgrade=true
}

resource "aws_elasticache_subnet_group" "main" { name="${local.app_name}-redis"
 subnet_ids=aws_subnet.data[*].id }
resource "aws_elasticache_replication_group" "main" {
  replication_group_id="${var.name}-prod"
 description="KY7 production Redis"
  engine="redis"
 engine_version="7.1"
 node_type=var.redis_node_type
 port=6379
 num_cache_clusters=1
  automatic_failover_enabled=false
 multi_az_enabled=false
 subnet_group_name=aws_elasticache_subnet_group.main.name
  security_group_ids=[aws_security_group.data.id]
 at_rest_encryption_enabled=true
 transit_encryption_enabled=true
}

resource "aws_cognito_user_pool" "owner" {
  name="${local.app_name}-owner"
 mfa_configuration="ON"
  admin_create_user_config { allow_admin_create_user_only=true }
  software_token_mfa_configuration { enabled=true }
  password_policy { minimum_length=14
 require_lowercase=true
 require_uppercase=true
 require_numbers=true
 require_symbols=true
 temporary_password_validity_days=7 }
  username_attributes=["email"]
  account_recovery_setting { recovery_mechanisms { name="verified_email"
 priority=1 } }
}
resource "aws_cognito_user_pool_domain" "owner" {
  domain="${var.name}-${random_string.cognito_suffix.result}"
 user_pool_id=aws_cognito_user_pool.owner.id
}
resource "aws_cognito_user_pool_client" "owner" {
  name="${local.app_name}-alb"
 user_pool_id=aws_cognito_user_pool.owner.id
 generate_secret=true
  allowed_oauth_flows_user_pool_client=true
 allowed_oauth_flows=["code"]
 allowed_oauth_scopes=["openid","email"]
  supported_identity_providers=["COGNITO"]
  callback_urls=["https://${var.domain_name}/oauth2/idpresponse"]
 logout_urls=["https://${var.domain_name}/"]
  explicit_auth_flows=["ALLOW_REFRESH_TOKEN_AUTH","ALLOW_USER_SRP_AUTH"]
}

resource "aws_acm_certificate" "app" {
  domain_name=var.domain_name
 validation_method="DNS"
  lifecycle { create_before_destroy=true }
}
data "aws_route53_zone" "app" { zone_id=var.route53_zone_id }
resource "aws_route53_record" "certificate_validation" {
  for_each={for dvo in aws_acm_certificate.app.domain_validation_options:dvo.domain_name=>{name=dvo.resource_record_name,record=dvo.resource_record_value,type=dvo.resource_record_type}}
  zone_id=data.aws_route53_zone.app.zone_id
 name=each.value.name
 type=each.value.type
 ttl=60
 records=[each.value.record]
}
resource "aws_acm_certificate_validation" "app" {
  certificate_arn=aws_acm_certificate.app.arn
  validation_record_fqdns=[for r in aws_route53_record.certificate_validation:r.fqdn]
}

resource "aws_lb" "app" {
  name="${var.name}-prod"
 internal=false
 load_balancer_type="application"
  security_groups=[aws_security_group.alb.id]
 subnets=aws_subnet.public[*].id
 idle_timeout=120
}
resource "aws_lb_target_group" "app" {
  name="${var.name}-prod"
 port=var.container_port
 protocol="HTTP"
 target_type="ip"
 vpc_id=aws_vpc.main.id
  health_check { path="/api/health"
 protocol="HTTP"
 matcher="200-399"
 interval=30
 timeout=5
 healthy_threshold=2
 unhealthy_threshold=3 }
}
resource "aws_lb_listener" "https" {
  load_balancer_arn=aws_lb.app.arn
 port=443
 protocol="HTTPS"
  ssl_policy="ELBSecurityPolicy-TLS13-1-2-2021-06"
 certificate_arn=aws_acm_certificate_validation.app.certificate_arn
  default_action {
    type="authenticate-cognito"
    authenticate_cognito {
      user_pool_arn=aws_cognito_user_pool.owner.arn
 user_pool_client_id=aws_cognito_user_pool_client.owner.id
      user_pool_domain=aws_cognito_user_pool_domain.owner.domain
 on_unauthenticated_request="authenticate"
      session_cookie_name="KY7Auth"
 session_timeout=3600
 scope="openid email"
    }
  }
  default_action { type="forward"
 target_group_arn=aws_lb_target_group.app.arn }
}
resource "aws_lb_listener" "http" {
  load_balancer_arn=aws_lb.app.arn
 port=80
 protocol="HTTP"
  default_action { type="redirect"
 redirect { port="443"
 protocol="HTTPS"
 status_code="HTTP_301" } }
}
resource "aws_route53_record" "app" {
  zone_id=data.aws_route53_zone.app.zone_id
 name=var.domain_name
 type="A"
  alias { name=aws_lb.app.dns_name
 zone_id=aws_lb.app.zone_id
 evaluate_target_health=true }
}
resource "aws_wafv2_web_acl" "app" {
  name="${var.name}-prod"
 scope="REGIONAL"
 default_action { allow {} }
  rule {
    name="AWSManagedCommonRules"
 priority=10
 override_action { none {} }
    statement { managed_rule_group_statement { name="AWSManagedRulesCommonRuleSet"
 vendor_name="AWS" } }
    visibility_config { cloudwatch_metrics_enabled=true
 metric_name="${var.name}-common-rules"
 sampled_requests_enabled=true }
  }
  rule {
    name="RateLimit"
 priority=20
 action { block {} }
    statement { rate_based_statement { limit=300
 aggregate_key_type="IP" } }
    visibility_config { cloudwatch_metrics_enabled=true
 metric_name="${var.name}-rate-limit"
 sampled_requests_enabled=true }
  }
  visibility_config { cloudwatch_metrics_enabled=true
 metric_name="${var.name}-waf"
 sampled_requests_enabled=true }
}
resource "aws_wafv2_web_acl_association" "app" { resource_arn=aws_lb.app.arn
 web_acl_arn=aws_wafv2_web_acl.app.arn }

data "aws_iam_policy_document" "ecs_assume" {
  statement { actions=["sts:AssumeRole"]
 principals { type="Service"
 identifiers=["ecs-tasks.amazonaws.com"] } }
}
resource "aws_iam_role" "ecs_execution" { name="${local.app_name}-ecs-execution"
 assume_role_policy=data.aws_iam_policy_document.ecs_assume.json }
resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role=aws_iam_role.ecs_execution.name
 policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}
resource "aws_iam_role_policy" "ecs_secrets" {
  role=aws_iam_role.ecs_execution.id
  policy=jsonencode({Version="2012-10-17",Statement=[{Effect="Allow",Action=["secretsmanager:GetSecretValue"],Resource=[
    aws_secretsmanager_secret.gemini.arn,aws_secretsmanager_secret.binance_key.arn,aws_secretsmanager_secret.binance_secret.arn,
    aws_secretsmanager_secret.destination_wallet.arn,aws_secretsmanager_secret.destination_network.arn
  ]}]})
}
resource "aws_iam_role" "ecs_task" { name="${local.app_name}-ecs-task"
 assume_role_policy=data.aws_iam_policy_document.ecs_assume.json }

resource "aws_ecs_cluster" "main" {
  name=local.app_name
  setting { name="containerInsights"
 value="enabled" }
}
resource "aws_ecs_task_definition" "app" {
  count=local.image != "" ? 1 : 0
  family=local.app_name
 requires_compatibilities=["FARGATE"]
 network_mode="awsvpc"
  cpu=var.task_cpu
 memory=var.task_memory
 execution_role_arn=aws_iam_role.ecs_execution.arn
 task_role_arn=aws_iam_role.ecs_task.arn
  runtime_platform { operating_system_family="LINUX"
 cpu_architecture="ARM64" }
  container_definitions=jsonencode([{
    name=var.name
 image=local.image
 essential=true
    portMappings=[{containerPort=var.container_port,hostPort=var.container_port,protocol="tcp"}]
    environment=[
      {name="NODE_ENV",value="production"},{name="PORT",value=tostring(var.container_port)},{name="TRADING_MODE",value="LIVE_VAULT"},
      {name="LIVE_AUTONOMOUS_ENABLED",value=tostring(var.enable_live_autonomous)},{name="LIVE_PRINCIPAL_USDT",value=tostring(var.live_principal_usdt)},
      {name="MAX_CAPITAL_ALLOCATION",value=tostring(var.max_capital_allocation)},{name="MAX_POSITION_SIZE",value=tostring(var.max_position_size)},
      {name="MAX_DAILY_LOSS",value=tostring(var.max_daily_loss)},{name="MAX_DRAWDOWN",value=tostring(var.max_drawdown)},
      {name="BINANCE_BASE_URL",value="https://api.binance.com"},{name="BINANCE_RECV_WINDOW",value="5000"},{name="BINANCE_IP_RESTRICTION_REQUIRED",value="true"},
      {name="BINANCE_ENABLE_WITHDRAWALS",value=tostring(var.enable_withdrawals)},{name="PROFIT_SWEEP_ENABLED",value=tostring(var.profit_sweep_enabled)},
      {name="PROFIT_SWEEP_MINIMUM",value="50"},{name="PROFIT_SWEEP_PERCENTAGE",value="50"},{name="PROFIT_SWEEP_ASSET",value="USDT"},
      {name="POSTGRES_HOST",value=aws_db_instance.main.address},{name="POSTGRES_PORT",value="5432"},{name="POSTGRES_DB",value="ky7"},{name="POSTGRES_USER",value="ky7"},
      {name="REDIS_URL",value="rediss://${aws_elasticache_replication_group.main.primary_endpoint_address}:6379"},
      {name="APP_URL",value="https://${var.domain_name}"}
    ]
    secrets=[
      {name="GEMINI_API_KEY",valueFrom=aws_secretsmanager_secret.gemini.arn},
      {name="BINANCE_API_KEY",valueFrom=aws_secretsmanager_secret.binance_key.arn},
      {name="BINANCE_API_SECRET",valueFrom=aws_secretsmanager_secret.binance_secret.arn},
      {name="DESTINATION_WALLET",valueFrom=aws_secretsmanager_secret.destination_wallet.arn},
      {name="DESTINATION_NETWORK",valueFrom=aws_secretsmanager_secret.destination_network.arn}
    ]
    logConfiguration={logDriver="awslogs",options={awslogs-group=aws_cloudwatch_log_group.app.name,awslogs-region=var.aws_region,awslogs-stream-prefix="ky7"}}
    healthCheck={command=["CMD-SHELL","wget -qO- http://127.0.0.1:3000/api/health || exit 1"],interval=30,timeout=5,retries=3,startPeriod=20}
  }])
}
resource "aws_ecs_service" "app" {
  count=local.image != "" ? 1 : 0
  name=local.app_name
 cluster=aws_ecs_cluster.main.id
 task_definition=aws_ecs_task_definition.app[0].arn
 desired_count=var.desired_count
 launch_type="FARGATE"
  deployment_minimum_healthy_percent=0
 deployment_maximum_percent=100
  deployment_circuit_breaker { enable=true
 rollback=true }
  network_configuration { subnets=aws_subnet.app[*].id
 security_groups=[aws_security_group.app.id]
 assign_public_ip=false }
  load_balancer { target_group_arn=aws_lb_target_group.app.arn
 container_name=var.name
 container_port=var.container_port }
  health_check_grace_period_seconds=90
  depends_on=[aws_lb_listener.https,aws_iam_role_policy.ecs_secrets]
}
resource "aws_sns_topic" "alerts" { name="${var.name}-production-alerts" }
resource "aws_cloudwatch_metric_alarm" "ecs_running" {
  count=local.image != "" ? 1 : 0
  alarm_name="${local.app_name}-ecs-no-running-task"
 namespace="ECS/ContainerInsights"
 metric_name="RunningTaskCount"
  dimensions={ClusterName=aws_ecs_cluster.main.name,ServiceName=aws_ecs_service.app[0].name}
  statistic="Minimum"
 period=60
 evaluation_periods=2
 threshold=1
 comparison_operator="LessThanThreshold"
 alarm_actions=[aws_sns_topic.alerts.arn]
}
resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name="${local.app_name}-alb-5xx"
 namespace="AWS/ApplicationELB"
 metric_name="HTTPCode_ELB_5XX_Count"
  dimensions={LoadBalancer=aws_lb.app.arn_suffix}
 statistic="Sum"
 period=60
 evaluation_periods=5
 threshold=5
  comparison_operator="GreaterThanThreshold"
 alarm_actions=[aws_sns_topic.alerts.arn]
}
resource "aws_cloudwatch_metric_alarm" "target_5xx" {
  alarm_name="${local.app_name}-target-5xx"
 namespace="AWS/ApplicationELB"
 metric_name="HTTPCode_Target_5XX_Count"
  dimensions={LoadBalancer=aws_lb.app.arn_suffix,TargetGroup=aws_lb_target_group.app.arn_suffix}
  statistic="Sum"
 period=60
 evaluation_periods=5
 threshold=5
 comparison_operator="GreaterThanThreshold"
 alarm_actions=[aws_sns_topic.alerts.arn]
}
