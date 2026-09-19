variable "aws_region" { type=string default="ap-south-1" }
variable "name" { type=string default="ky7" }
variable "environment" { type=string default="production" }
variable "vpc_cidr" { type=string default="10.42.0.0/16" }
variable "availability_zones" { type=list(string) default=["ap-south-1a","ap-south-1b"] }
variable "domain_name" { type=string description="Public HTTPS hostname, e.g. trade.example.com." }
variable "route53_zone_id" { type=string description="Route53 hosted zone ID." }
variable "container_port" { type=number default=3000 }
variable "image_uri" { type=string default="" description="ECR image URI; empty skips ECS service during bootstrap." }
variable "task_cpu" { type=number default=2048 }
variable "task_memory" { type=number default=4096 }
variable "desired_count" { type=number default=1 }
variable "single_nat_gateway" { type=bool default=true description="One NAT/EIP for lower cost; false creates one per AZ." }
variable "enable_live_autonomous" { type=bool default=false }
variable "enable_withdrawals" { type=bool default=false }
variable "profit_sweep_enabled" { type=bool default=false }
variable "live_principal_usdt" { type=number default=0 }
variable "max_capital_allocation" { type=number default=0.25 }
variable "max_position_size" { type=number default=0.10 }
variable "max_daily_loss" { type=number default=0.03 }
variable "max_drawdown" { type=number default=0.10 }
variable "db_instance_class" { type=string default="db.t4g.micro" }
variable "redis_node_type" { type=string default="cache.t4g.micro" }
variable "log_retention_days" { type=number default=30 }
