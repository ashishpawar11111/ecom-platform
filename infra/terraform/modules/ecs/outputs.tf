output "service_name" {
  value = aws_ecs_service.api.name
}

output "task_arn" {
  value = aws_ecs_task_definition.api.arn
}

output "cluster_name" {
  value = aws_ecs_cluster.main.name
}