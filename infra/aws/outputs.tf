output "app_url" { value="https://${var.domain_name}" }
output "alb_dns_name" { value=aws_lb.app.dns_name }
output "ecs_cluster_name" { value=aws_ecs_cluster.main.name }
output "ecs_service_name" { value=var.image_uri != "" ? aws_ecs_service.app[0].name : null }
output "ecr_repository_url" { value=aws_ecr_repository.app.repository_url }
output "nat_public_ips" { value=aws_eip.nat[*].public_ip }
output "rds_endpoint" { value=aws_db_instance.main.address }
output "redis_endpoint" { value=aws_elasticache_replication_group.main.primary_endpoint_address }
output "cognito_user_pool_id" { value=aws_cognito_user_pool.owner.id }
output "cognito_user_pool_client_id" { value=aws_cognito_user_pool_client.owner.id }
output "cognito_domain" { value=aws_cognito_user_pool_domain.owner.domain }
output "alerts_topic_arn" { value=aws_sns_topic.alerts.arn }
