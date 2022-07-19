helpFunction()
{
   echo ""
   echo "Usage: $0 -f inputFileName -t targetHostName -d true"
   echo -e "\t-f file that contains input URLs"
   echo -e "\t-t target hostname as FQDN"
   echo -e "\t-d turn on debug"
   exit 1 # Exit script after printing help
}

while getopts "f:t:d:" opt
do
   case "$opt" in
      f ) inputFileName="$OPTARG" ;;
      t ) targetHostName="$OPTARG" ;;
      d ) debug="$OPTARG" ;;
      ? ) helpFunction ;; # Print helpFunction in case parameter is non-existent
   esac
done

# Print helpFunction in case parameters are empty
if [ -z "$inputFileName" ] || [ -z "$targetHostName" ] || [ -z "$debug" ]
then
   echo "Some or all of the parameters are empty";
   helpFunction
fi

# Begin script in case all parameters are correct
if [ "$debug" = "true" ]; then 
  echo "INPUT ARGS"
  echo "$inputFileName"
  echo "$targetHostName"
  echo "$debug"
fi

LINE_COUNT=0
TEST_COUNT=0
SUCCESS=0
ERRORS=0

mkdir -p output

NOW=$(date +"%m-%d-%Y-%H-%M-%S")
ERROR_OUTPUT_JSON_FILE="./output/test-redirect-locations-errors-$NOW.json"

regexFrom="\"regex\": \"([^\"]*)\""
regexTo="\"to\": \"([^\"]*)\""

printf "[\n" >> "$ERROR_OUTPUT_JSON_FILE"

while IFS= read -r line
do

  LINE_COUNT=$(( LINE_COUNT + 1 )) 

  if [ "$debug" = "true" ]; then echo "$line"; fi

  if [[ $line =~ $regexFrom ]]; then
      url="$targetHostName${BASH_REMATCH[1]}"
      if [ "$debug" = "true" ]; then echo "processing key:value of [$name=$value]"; fi
  else
      if [ "$debug" = "true" ]; then echo "skipping line"; fi
      continue
  fi

  if [[ $line =~ $regexTo ]]; then
      toTarget="${BASH_REMATCH[1]}"
      if [ "$debug" = "true" ]; then echo "processing key:value of [$toName=$toValue]"; fi
  else
      if [ "$debug" = "true" ]; then echo "skipping line"; fi
      continue
  fi
 
  if [ "$debug" = "true" ]; then echo -n "Checking $url"; fi

  TEST_COUNT=$(( TEST_COUNT + 1 )) 

  # read the response to a variable
  response=$(curl -H 'Cache-Control: no-cache' -s -k --max-time 2 --write-out '%{http_code} %{redirect_url} %{num_redirects}' "$url")
  
  headers=$(sed -n '1,/^\r$/p' <<<"$response")
  content=$(sed -e '1,/^\r$/d' -e '$d' <<<"$response")

  read -r -a fields <<< "$(tail -n1 <<< "$response")"

  http_code=${fields[0]}
  redirect_url=${fields[1]}
  redirect_count=${fields[2]}

  location=""

  if [[ $redirect_url =~ $targetHostName(.*) ]]; then
    location="${BASH_REMATCH[1]}"

  else
    location="$redirect_url"
  fi  

  if [ "$debug" = "true" ]; then
    printf "Status: %s\n\n" "$http_code"
    printf "Redirect-url: %s\n\n" "$redirect_url"
    printf "location: %s\n\n" "$location"
  fi

  # Assert that the lamba returns a 301
  if (( http_code != 301)); then
    ERRORS=$(( ERRORS + 1 ))
    echo "[$LINE_COUNT] $url STATUS_CODE, expeceted [301] actual is [$http_code]"
    printf "$line\n" >> "$ERROR_OUTPUT_JSON_FILE"
    continue
  fi

  toTarget=$(echo "$toTarget" | iconv -f utf-8 -t ascii//translit)

  # Assert that the labmba location in the header response matches the "To" target in the json file
  if [ "$location" != "$toTarget" ]; then
    ERRORS=$(( ERRORS + 1 ))
    echo "[$LINE_COUNT] $url LOCATION, expeceted [$toTarget] actual is [$location]"
    printf "$line\n" >> "$ERROR_OUTPUT_JSON_FILE"
    continue
  fi

  SUCCESS=$(( SUCCESS + 1 ))

done < "$inputFileName"

printf "]\n" >> "$ERROR_OUTPUT_JSON_FILE"

if (( ERRORS != 0 ))
then
  echo "\033[0;31m!!! Errors checking URLs!\033[m"
fi

echo "Test Results: Lines [$LINE_COUNT] Tests [$TEST_COUNT] Success [$SUCCESS] and Errors [$ERRORS]"
