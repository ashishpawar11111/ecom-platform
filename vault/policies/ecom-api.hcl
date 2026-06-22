# vault/policies/ecom-api.hcl
path "secret/data/ecom/db" {
  capabilities = ["read"]
}

path "secret/data/ecom/api" {
  capabilities = ["read"]
}

# Deny access to other paths
path "secret/*" {
  capabilities = ["deny"]
}

# Allow token renewal
path "auth/token/renew-self" {
  capabilities = ["update"]
}