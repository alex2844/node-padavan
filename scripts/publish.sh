#!/usr/bin/env bash
set -euo pipefail

readonly PACKAGES_DIR="packages"
readonly NODERED_FLOWS_URL="https://flows.nodered.org/add/node"

changed_files=()
original_versions=()

trap cleanup EXIT

function cleanup() {
	echo
	rm -f "${PACKAGES_DIR}"/*/*.tgz
	if [[ ${#changed_files[@]} -eq 0 ]]; then
		echo "🧹 Очистка не требуется."
		return
	fi
	echo "🧹 Очистка: восстановление версий в package.json..."
	for i in "${!changed_files[@]}"; do
		local file_path="${changed_files[${i}]}"
		local version="${original_versions[${i}]}"
		echo "   - Восстановление версии '${version}' в файле ${file_path}"
		local json=$(jq --tab --arg version "${version}" '.version = $version' "${file_path}")
		echo "${json}" >"${file_path}"
	done
	echo "✅ Версии восстановлены."
}

function error() {
	echo "❌ Ошибка: $1" >&2
	exit 1
}

function check_deps() {
	local missing_deps=0
	for dep in jq bun curl; do
		if ! command -v "${dep}" &>/dev/null; then
			echo "❌ Утилита '${dep}' не найдена." >&2
			missing_deps=1
		fi
	done
	if [[ ${missing_deps} -eq 1 ]]; then
		exit 1
	fi
}

function refresh_nodered_flow() {
	local pkg_name="$1"
	echo "   - 🟡 Обновление на flows.nodered.org..."
	local headers_file=$(mktemp)
	local response_body=$(curl -s -D "${headers_file}" "${NODERED_FLOWS_URL}")
	local cookie=$(grep -oP '_csrf=.*?;' "${headers_file}" | head -n 1 || true)
	local csrf_token=$(echo "${response_body}" | grep -oP 'name="_csrf" type="hidden" value="\K[^"]+' || true)
	rm -f "${headers_file}"
	if [[ -z "${cookie}" ]] || [[ -z "${csrf_token}" ]]; then
		echo "   - ⚠️ Не удалось получить токены для Node-RED."
		return
	fi
	local post_response=$(curl -sL -X POST \
		-H "cookie: ${cookie}" \
		--data-urlencode "_csrf=${csrf_token}" \
		--data-urlencode "module=${pkg_name}" \
		"${NODERED_FLOWS_URL}"
	)
	if [[ "${post_response,,}" == *"added"* ]] || [[ "${post_response,,}" == *"updated"* ]]; then
		echo "   - ✅ Обновлено на Node-RED Flows."
	else
		echo "   - ⚠️ Ошибка обновления Node-RED Flows."
		echo "   - Ответ сервера: ${post_response}"
	fi
}

function main() {
	echo "🔍 Работаем в корне проекта: ${PWD}"
	check_deps

	local target_version
	if [[ -n "${1-}" ]]; then
		target_version="$1"
		echo "✅ Используется версия из аргумента: ${target_version}"
	else
		target_version=$(jq -r '.version // empty' package.json)
		if [[ -z "${target_version}" ]]; then
			error "Не удалось прочитать поле 'version' из корневого package.json."
		fi
		echo "✅ Используется версия из корневого package.json: ${target_version}"
	fi
	echo

	echo "Проверка и обновление версий пакетов до ${target_version}..."
	local packages_to_publish=()
	for pkg_file in "package.json" "${PACKAGES_DIR}"/*/package.json; do
		[[ ! -f "${pkg_file}" ]] && continue
		local current_version=$(jq -r '.version' "${pkg_file}")
		if [[ "${current_version}" != "${target_version}" ]]; then
			echo "   - Обновление ${pkg_file} (была версия ${current_version})"
			local json=$(jq --tab --arg version "${target_version}" '.version = $version' "${pkg_file}")
			echo "${json}" >"${pkg_file}"
			[[ "${pkg_file}" == "package.json" ]] && continue;
			changed_files+=("${pkg_file}")
			original_versions+=("${current_version}")
		fi
		if [[ "$(jq -r '.private // false' "${pkg_file}")" != "true" ]]; then
			packages_to_publish+=("$(dirname "${pkg_file}")")
		fi
	done
	echo "✅ Проверка версий завершена."
	echo

	if [[ ${#changed_files[@]} -gt 0 ]]; then
		echo "Обновление файла зависимостей bun.lockb..."
		bun install
		echo "✅ Файл блокировки обновлен."
	fi
	echo

	echo "Публикация публичных пакетов..."
	if [[ ${#packages_to_publish[@]} -eq 0 ]]; then
		echo "⚪️ Публичные пакеты для публикации не найдены."
	else
		for pkg_dir in "${packages_to_publish[@]}"; do
			local pkg_file="${pkg_dir}/package.json"
			local pkg_name=$(jq -r '.name' "${pkg_file}")
			echo "🔄 Проверка и публикация пакета: ${pkg_name} (версия ${target_version})"
			local published_version=$(bun info "${pkg_name}" version 2>/dev/null || echo "not_found")
			if [[ "${published_version}" == "${target_version}" ]]; then
				echo "   - ⚠️ Версия ${target_version} уже существует в NPM. Публикация пропущена."
			else
				if [[ "${published_version}" == "not_found" ]]; then
					echo "   - 🚀 Пакет не найден в NPM. Публикация версии ${target_version}..."
				else
					echo "   - 🚀 Обнаружена версия ${published_version}. Публикация новой версии ${target_version}..."
				fi
				# (cd "${pkg_dir}" && bun publish)
				echo "   - 📦 Упаковка (bun pm pack)..."
				(cd "${pkg_dir}" && bun pm pack)
				echo "   - 🚀 Публикация архива через NPM..."
				bunx npm publish "${pkg_dir}/${pkg_name}-${target_version}.tgz" --provenance
				echo "   - ✅ Опубликован."
				if jq -e '."node-red"' "${pkg_file}" >/dev/null; then
					refresh_nodered_flow "${pkg_name}"
				fi
			fi
			echo
		done
	fi

	echo "🎉 Готово."
}

main "$@"
